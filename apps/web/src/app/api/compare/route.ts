import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uuids = searchParams.get('benchmark_ids')?.split(',').filter(Boolean) || []

  if (uuids.length < 2) {
    return apiError('At least 2 benchmark IDs required', 400)
  }
  if (uuids.length > 5) {
    return apiError('Maximum 5 benchmarks can be compared', 400)
  }

  const benchmarks = await db.benchmark.findMany({
    where: {
      uuid: { in: uuids },
      visibility: 'public',
      status: 'completed',
      deletedAt: null,
    },
    include: {
      country: true,
      provider: { select: { name: true, slug: true, logoUrl: true } },
      results: true,
      scores: { orderBy: { createdAt: 'desc' }, take: 1 },
      locations: true,
    },
  })

  if (benchmarks.length === 0) {
    return apiError('No benchmarks found', 404)
  }

  // Build comparison matrix
  const allMetrics = new Set<string>()
  for (const b of benchmarks) {
    for (const r of b.results) {
      allMetrics.add(`${r.category}:${r.metricName}`)
    }
  }

  const compareMetrics = Array.from(allMetrics).map((key) => {
    const [category, metricName] = key.split(':')
    const values = benchmarks.map((b) => {
      const result = b.results.find(
        (r) => r.category === category && r.metricName === metricName,
      )
      return { benchmarkId: b.uuid, value: result?.metricValue ?? null, unit: result?.unit }
    })
    return { key, category, metricName, values }
  })

  return apiResponse({
    benchmarks: benchmarks.map((b) => ({
      ...b,
      uptimeSeconds: b.uptimeSeconds?.toString(),
    })),
    metrics: compareMetrics,
  })
}
