import { NextRequest, NextResponse } from 'next/server'

const DNSBLS = [
  { name: 'Spamhaus ZEN', host: 'zen.spamhaus.org', description: 'Composite of SBL, SBLCSS, XBL, PBL' },
  { name: 'SpamCop', host: 'bl.spamcop.net', description: 'Spam source detection' },
  { name: 'SORBS Spam', host: 'spam.dnsbl.sorbs.net', description: 'SORBS spam detection' },
  { name: 'SORBS HTTP', host: 'http.dnsbl.sorbs.net', description: 'Open HTTP proxies' },
  { name: 'Barracuda', host: 'b.barracudacentral.org', description: 'Barracuda email reputation' },
  { name: 'CBL', host: 'cbl.abuseat.org', description: 'Composite Blocking List' },
  { name: 'DroneBL', host: 'dnsbl.dronebl.org', description: 'Drone/bot detection' },
  { name: 'StopSpam', host: 'ix.dnsbl.manitu.net', description: 'German DNSBL' },
]

async function dnsLookup(name: string, type = 'A'): Promise<string[]> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
      { signal: AbortSignal.timeout(5_000) }
    )
    const json = await res.json()
    if (json.Status !== 0 || !json.Answer) return []
    return json.Answer.map((a: { data: string }) => a.data)
  } catch { return [] }
}

function reverseIp(ip: string) {
  return ip.split('.').reverse().join('.')
}

function isValidIpv4(ip: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split('.').every(o => +o <= 255)
}

export async function GET(req: NextRequest) {
  let query = req.nextUrl.searchParams.get('ip')?.trim() ?? ''
  if (!query) return NextResponse.json({ error: 'ip is required' }, { status: 400 })

  // If it's a domain, resolve to IP first
  let ip = query
  if (!isValidIpv4(query)) {
    const resolved = await dnsLookup(query, 'A')
    if (!resolved.length) return NextResponse.json({ success: false, error: 'Cannot resolve domain to IP' })
    ip = resolved[0]
  }

  if (!isValidIpv4(ip)) return NextResponse.json({ success: false, error: 'Invalid IPv4 address' })

  const reversed = reverseIp(ip)

  const checks = await Promise.all(
    DNSBLS.map(async (dnsbl) => {
      const query = `${reversed}.${dnsbl.host}`
      const answers = await dnsLookup(query, 'A')
      const listed = answers.length > 0
      let reason: string | null = null
      if (listed) {
        const txtAnswers = await dnsLookup(query, 'TXT')
        reason = txtAnswers.join(' ') || answers[0] || null
      }
      return { ...dnsbl, listed, returnCode: listed ? answers[0] : null, reason }
    })
  )

  const listedCount = checks.filter(c => c.listed).length

  return NextResponse.json({
    success: true,
    query,
    ip,
    listedCount,
    totalChecked: DNSBLS.length,
    checks,
  })
}
