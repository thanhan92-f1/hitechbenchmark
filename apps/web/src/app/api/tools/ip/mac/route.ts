import { NextRequest, NextResponse } from 'next/server'

function normalizeMac(mac: string) {
  // Accept XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXXXXXXXXXX
  const clean = mac.replace(/[:\-.\s]/g, '').toUpperCase()
  if (!/^[0-9A-F]{12}$/.test(clean)) return null
  return clean
}

function formatMac(clean: string) {
  return clean.match(/.{2}/g)!.join(':')
}

export async function GET(req: NextRequest) {
  const mac = req.nextUrl.searchParams.get('mac')?.trim() ?? ''
  if (!mac) return NextResponse.json({ error: 'mac is required' }, { status: 400 })

  const clean = normalizeMac(mac)
  if (!clean) return NextResponse.json({ success: false, error: 'Invalid MAC address format' })

  const oui = clean.slice(0, 6)
  const formatted = formatMac(clean)

  try {
    const res = await fetch(`https://api.macvendors.com/${encodeURIComponent(formatted)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HiTechBenchmark/1.0)',
        Accept: 'text/plain',
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (res.status === 404) {
      return NextResponse.json({ success: true, mac: formatted, oui, vendor: null, found: false })
    }

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `API error ${res.status}` })
    }

    const vendor = (await res.text()).trim()
    return NextResponse.json({ success: true, mac: formatted, oui, vendor, found: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
