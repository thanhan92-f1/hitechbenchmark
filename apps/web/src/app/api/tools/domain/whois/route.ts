import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.trim().toLowerCase()
  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 })

  const clean = domain.replace(/^https?:\/\//, '').split('/')[0]

  try {
    // Try RDAP first
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(clean)}`
    const res = await fetch(rdapUrl, {
      headers: { Accept: 'application/rdap+json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `RDAP lookup failed (${res.status})` })
    }

    const data = await res.json()

    // Parse key fields from RDAP response
    const registrar = data.entities?.find((e: { roles?: string[] }) => e.roles?.includes('registrar'))
    const registrant = data.entities?.find((e: { roles?: string[] }) => e.roles?.includes('registrant'))

    const events: Record<string, string> = {}
    for (const ev of data.events ?? []) {
      events[ev.eventAction] = ev.eventDate
    }

    const nameservers = (data.nameservers ?? []).map((ns: { ldhName: string }) => ns.ldhName)
    const status = data.status ?? []

    return NextResponse.json({
      success: true,
      domain: clean,
      data: {
        domainName: data.ldhName ?? clean,
        status,
        created: events['registration'] ?? null,
        updated: events['last changed'] ?? null,
        expires: events['expiration'] ?? null,
        registrar: registrar?.vcardArray?.[1]?.find((v: string[]) => v[0] === 'fn')?.[3] ?? null,
        registrant: registrant?.vcardArray?.[1]?.find((v: string[]) => v[0] === 'fn')?.[3] ?? null,
        nameservers,
        handle: data.handle ?? null,
        raw: data,
      },
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
