import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError } from '@/lib/utils'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  const { uuid } = await params

  const benchmark = await db.benchmark.findUnique({
    where: { uuid },
    include: {
      scores: true,
      results: { orderBy: [{ category: 'asc' }, { metricName: 'asc' }] },
      locations: { orderBy: { testLocation: 'asc' } },
      provider: { select: { name: true, slug: true } },
      country: { select: { code: true, name: true } },
      asn: { select: { asnNumber: true, name: true } },
    },
  })

  if (!benchmark) return apiError('Benchmark not found', 404)
  if (benchmark.userId !== session.user.id) return apiError('Forbidden', 403)

  const payload = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    uuid: benchmark.uuid,
    status: benchmark.status,
    visibility: benchmark.visibility,
    submittedAt: benchmark.createdAt,
    system: {
      hostname: benchmark.hostname,
      ipv4: benchmark.ipv4,
      ipv6: benchmark.ipv6,
      osName: benchmark.osName,
      osVersion: benchmark.osVersion,
      kernel: benchmark.kernel,
      architecture: benchmark.architecture,
      virtualization: benchmark.virtualization,
      cpuModel: benchmark.cpuModel,
      cpuCores: benchmark.cpuCores,
      cpuThreads: benchmark.cpuThreads,
      cpuFrequencyMhz: benchmark.cpuFrequencyMhz,
      ramTotalMb: benchmark.ramTotalMb,
      swapTotalMb: benchmark.swapTotalMb,
      diskTotalGb: benchmark.diskTotalGb,
      uptimeSeconds: benchmark.uptimeSeconds,
      loadAverage: benchmark.loadAverage,
      isp: benchmark.isp,
      organization: benchmark.organization,
      reverseDns: benchmark.reverseDns,
    },
    location: {
      country: benchmark.country,
      city: benchmark.city,
      region: benchmark.region,
      asn: benchmark.asn,
    },
    provider: benchmark.provider,
    scores: benchmark.scores[0] ?? null,
    results: benchmark.results.map((r) => ({
      category: r.category,
      metricName: r.metricName,
      metricValue: r.metricValue,
      unit: r.unit,
    })),
    networkTests: benchmark.locations.map((l) => ({
      testLocation: l.testLocation,
      downloadMbps: l.downloadMbps,
      uploadMbps: l.uploadMbps,
      pingMs: l.pingMs,
      jitterMs: l.jitterMs,
    })),
  }

  const body = JSON.stringify(payload, null, 2)
  const filename = `benchmark-${uuid.slice(0, 8)}.json`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
