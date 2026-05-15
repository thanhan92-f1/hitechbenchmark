import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { apiResponse } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const CACHE_KEY = 'rankings:top100'
const CACHE_TTL = 120 // 2 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'))

  const cpuType = searchParams.get('cpu_type')
  const scoreCategory = searchParams.get('category') || 'total'

  const cacheKey = `${CACHE_KEY}:${page}:${perPage}:${cpuType || 'all'}:${scoreCategory}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return apiResponse(JSON.parse(cached))
  }

  const skip = (page - 1) * perPage

  const cpuFilter = cpuType ? (() => {
    if (cpuType === 'arm') return { cpuModel: { contains: 'arm', mode: 'insensitive' as const } }
    if (cpuType === 'amd') return { cpuModel: { contains: 'amd', mode: 'insensitive' as const } }
    if (cpuType === 'intel') return { cpuModel: { contains: 'intel', mode: 'insensitive' as const } }
    return {}
  })() : {}

  const sortField = scoreCategory === 'cpu' ? 'cpuScore' :
    scoreCategory === 'disk' ? 'diskScore' :
    scoreCategory === 'memory' ? 'memoryScore' :
    scoreCategory === 'network' ? 'networkScore' :
    'totalScore'

  const benchmarkWhere = {
    visibility: 'public' as const,
    status: 'completed' as const,
    deletedAt: null,
    trustScore: { gte: 0.5 },
    ...cpuFilter,
  }

  // Get benchmarks ordered by score
  const [scores, total] = await Promise.all([
    db.benchmarkScore.findMany({
      where: {
        [sortField]: { not: null },
        benchmark: benchmarkWhere,
      },
      orderBy: { [sortField]: 'desc' },
      skip,
      take: perPage,
      distinct: ['benchmarkId'],
      include: {
        benchmark: {
          select: {
            uuid: true,
            hostname: true,
            cpuModel: true,
            cpuCores: true,
            ramTotalMb: true,
            virtualization: true,
            city: true,
            createdAt: true,
            country: { select: { code: true, name: true, flagEmoji: true } },
            provider: { select: { name: true, slug: true, logoUrl: true } },
          },
        },
      },
    }),
    db.benchmarkScore.count({
      where: {
        [sortField]: { not: null },
        benchmark: benchmarkWhere,
      },
    }),
  ])

  const rankings = scores.map((s, i) => ({
    rank: skip + i + 1,
    totalScore: s.totalScore,
    cpuScore: s.cpuScore,
    diskScore: s.diskScore,
    memoryScore: s.memoryScore,
    networkScore: s.networkScore,
    benchmark: s.benchmark,
  }))

  const result = {
    rankings,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result))

  return apiResponse(result)
}
