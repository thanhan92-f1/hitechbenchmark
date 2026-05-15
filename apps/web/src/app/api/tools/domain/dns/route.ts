import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR', 'SRV', 'CAA', 'DNSKEY', 'DS']

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.trim()
  const type = (req.nextUrl.searchParams.get('type') ?? 'A').toUpperCase()

  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 })
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'invalid type' }, { status: 400 })

  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`
    const res = await fetch(url, { next: { revalidate: 30 } })
    const json = await res.json()

    return NextResponse.json({
      success: true,
      domain,
      type,
      status: json.Status,
      answers: json.Answer ?? [],
      authority: json.Authority ?? [],
      additional: json.Additional ?? [],
    })
  } catch {
    return NextResponse.json({ success: false, error: 'DNS lookup failed' }, { status: 500 })
  }
}
