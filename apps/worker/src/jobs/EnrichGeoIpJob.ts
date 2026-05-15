import { PrismaClient } from '@hitechbenchmark/db'

const prisma = new PrismaClient()

async function lookupGeoIp(ip: string) {
  if (!ip || ip === '127.0.0.1') return null
  try {
    const fields = 'status,country,countryCode,region,city,isp,org,as,timezone'
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=${fields}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success') return null

    let asn: number | undefined
    if (data.as) {
      const m = data.as.match(/^AS(\d+)/)
      if (m) asn = parseInt(m[1], 10)
    }

    return {
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      city: data.city,
      isp: data.isp,
      organization: data.org,
      asn,
    }
  } catch {
    return null
  }
}

export async function enrichGeoIp({ benchmarkId }: { benchmarkId: string }) {
  const benchmark = await prisma.benchmark.findUnique({ where: { id: benchmarkId } })
  if (!benchmark?.ipv4) return

  const geo = await lookupGeoIp(benchmark.ipv4)
  if (!geo) return

  // Find or create country
  let countryId: string | undefined
  if (geo.countryCode) {
    const country = await prisma.country.upsert({
      where: { code: geo.countryCode },
      update: { name: geo.country || geo.countryCode },
      create: { code: geo.countryCode, name: geo.country || geo.countryCode },
    })
    countryId = country.id
  }

  // Find or create ASN
  let asnId: string | undefined
  if (geo.asn) {
    const asn = await prisma.asn.upsert({
      where: { asnNumber: geo.asn },
      update: { name: geo.isp || `AS${geo.asn}`, organization: geo.organization },
      create: {
        asnNumber: geo.asn,
        name: geo.isp || `AS${geo.asn}`,
        organization: geo.organization,
        countryId,
      },
    })
    asnId = asn.id
  }

  await prisma.benchmark.update({
    where: { id: benchmarkId },
    data: {
      countryId,
      asnId,
      city: geo.city || benchmark.city,
      region: geo.region || benchmark.region,
      isp: geo.isp || benchmark.isp,
      organization: geo.organization || benchmark.organization,
    },
  })

  console.log(`[EnrichGeoIp] Benchmark ${benchmarkId} enriched: ${geo.countryCode}, ASN${geo.asn}`)
}
