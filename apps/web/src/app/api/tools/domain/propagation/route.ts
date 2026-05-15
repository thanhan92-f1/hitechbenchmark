import { NextRequest, NextResponse } from 'next/server'

const SERVERS = [
  { name: 'Google', location: 'Global', endpoint: 'https://dns.google/resolve', accept: null },
  { name: 'Cloudflare', location: 'Global', endpoint: 'https://cloudflare-dns.com/dns-query', accept: 'application/dns-json' },
  { name: 'Quad9', location: 'Global', endpoint: 'https://dns.quad9.net/dns-query', accept: 'application/dns-json' },
]

const VALID_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA']

async function queryServer(
  endpoint: string, accept: string | null, name: string, type: string
) {
  const start = Date.now()
  try {
    const url = `${endpoint}?name=${encodeURIComponent(name)}&type=${type}`
    const headers: Record<string, string> = {}
    if (accept) headers['Accept'] = accept
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8_000) })
    const json = await res.json()
    const ms = Date.now() - start
    return {
      status: json.Status as number,
      answers: (json.Answer ?? []) as Array<{ name: string; type: number; TTL: number; data: string }>,
      ms,
      error: null as string | null,
    }
  } catch (err) {
    return { status: -1, answers: [], ms: Date.now() - start, error: (err as Error).message }
  }
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.trim() ?? ''
  const type = (req.nextUrl.searchParams.get('type') ?? 'A').toUpperCase()

  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'invalid type' }, { status: 400 })

  const results = await Promise.all(
    SERVERS.map(async (srv) => {
      const r = await queryServer(srv.endpoint, srv.accept, domain, type)
      return {
        server: srv.name,
        location: srv.location,
        ...r,
      }
    })
  )

  // Determine propagation status
  const successful = results.filter(r => !r.error && r.status === 0)
  const allMatch = successful.length > 1 && successful.every(r => {
    const data = r.answers.map(a => a.data).sort().join(',')
    return data === successful[0].answers.map(a => a.data).sort().join(',')
  })

  return NextResponse.json({
    success: true,
    domain,
    type,
    propagated: allMatch,
    results,
  })
}
