export interface GeoIpResult {
  ip: string
  country?: string
  countryCode?: string
  region?: string
  city?: string
  isp?: string
  organization?: string
  asn?: number
  asnOrg?: string
  timezone?: string
  lat?: number
  lon?: number
}

export async function lookupGeoIp(ip: string): Promise<GeoIpResult | null> {
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null
  }

  try {
    // ip-api.com supports ASN data in the fields parameter
    const fields = 'status,country,countryCode,region,city,isp,org,as,query,timezone,lat,lon'
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=${fields}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    })

    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 'success') return null

    // Parse ASN from "AS12345 Organization Name"
    let asn: number | undefined
    let asnOrg: string | undefined
    if (data.as) {
      const match = data.as.match(/^AS(\d+)\s+(.+)$/)
      if (match) {
        asn = parseInt(match[1], 10)
        asnOrg = match[2]
      }
    }

    return {
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      city: data.city,
      isp: data.isp,
      organization: data.org,
      asn,
      asnOrg,
      timezone: data.timezone,
      lat: data.lat,
      lon: data.lon,
    }
  } catch {
    return null
  }
}
