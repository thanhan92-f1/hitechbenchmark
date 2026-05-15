import { NextResponse } from 'next/server'
import { resolve4 } from 'node:dns/promises'

// DNSBL lists to check
const DNSBLS = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'dnsbl.sorbs.net',
  'spam.dnsbl.sorbs.net',
  'b.barracudacentral.org',
  'dnsbl-1.uceprotect.net',
]

function reverseIp(ip: string): string {
  return ip.split('.').reverse().join('.')
}

async function checkDnsbl(reversedIp: string, dnsbl: string): Promise<boolean> {
  try {
    await resolve4(`${reversedIp}.${dnsbl}`)
    return true // listed
  } catch {
    return false // not listed
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ip = searchParams.get('ip')

  if (!ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return NextResponse.json({ success: false, error: 'Invalid IP' }, { status: 400 })
  }

  // Skip private/RFC1918 addresses
  const parts = ip.split('.').map(Number)
  if (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127
  ) {
    return NextResponse.json({
      success: true,
      data: { ip, listed: false, privateIp: true, checks: [] },
    })
  }

  const reversedIp = reverseIp(ip)

  const results = await Promise.allSettled(
    DNSBLS.map(async (dnsbl) => ({
      dnsbl,
      listed: await checkDnsbl(reversedIp, dnsbl),
    }))
  )

  const checks = results
    .filter((r): r is PromiseFulfilledResult<{ dnsbl: string; listed: boolean }> => r.status === 'fulfilled')
    .map(r => r.value)

  const listedOn = checks.filter(c => c.listed).map(c => c.dnsbl)
  const listed = listedOn.length > 0

  return NextResponse.json({
    success: true,
    data: {
      ip,
      listed,
      listedOn,
      checks: checks.map(c => ({ dnsbl: c.dnsbl, listed: c.listed })),
      checkedAt: new Date().toISOString(),
    },
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
