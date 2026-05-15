import { NextRequest, NextResponse } from 'next/server'

const FIELDS = 'status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query'

export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get('ip')?.trim() ?? ''

  // If no IP given, use the requester's IP
  const target = ip || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || ''

  try {
    const url = target
      ? `http://ip-api.com/json/${encodeURIComponent(target)}?fields=${FIELDS}`
      : `http://ip-api.com/json/?fields=${FIELDS}`

    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
    const data = await res.json()

    if (data.status === 'fail') {
      return NextResponse.json({ success: false, error: data.message ?? 'lookup failed' })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
