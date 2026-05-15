import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { apiResponse } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const CACHE_KEY = 'stats:overview'
const CACHE_TTL = 60 // 1 minute

export async function GET() {
  // Try cache first
  const cached = await redis.get(CACHE_KEY)
  if (cached) {
    return apiResponse(JSON.parse(cached))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalBenchmarks,
    todayBenchmarks,
    publicBenchmarks,
    privateBenchmarks,
    totalProviders,
    topCountries,
    topProviders,
    recentBenchmarks,
  ] = await Promise.all([
    db.benchmark.count({ where: { status: 'completed', deletedAt: null } }),
    db.benchmark.count({
      where: { status: 'completed', deletedAt: null, createdAt: { gte: today } },
    }),
    db.benchmark.count({
      where: { status: 'completed', visibility: 'public', deletedAt: null },
    }),
    db.benchmark.count({
      where: { status: 'completed', visibility: 'private', deletedAt: null },
    }),
    db.provider.count({ where: { isActive: true } }),
    db.benchmark.groupBy({
      by: ['countryId'],
      where: { status: 'completed', visibility: 'public', countryId: { not: null }, deletedAt: null },
      _count: true,
      orderBy: { _count: { countryId: 'desc' } },
      take: 10,
    }),
    db.provider.findMany({
      where: { isActive: true, benchmarkCount: { gt: 0 } },
      orderBy: [{ benchmarkCount: 'desc' }],
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        avgScore: true,
        benchmarkCount: true,
        country: { select: { code: true, name: true, flagEmoji: true } },
      },
    }),
    db.benchmark.findMany({
      where: { visibility: 'public', status: 'completed', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
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
        provider: { select: { name: true, slug: true } },
        scores: { select: { totalScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
  ])

  // Resolve country IDs for top countries
  const countryIds = topCountries.map((c) => c.countryId!).filter(Boolean)
  const countries = await db.country.findMany({
    where: { id: { in: countryIds } },
    select: { id: true, code: true, name: true, flagEmoji: true },
  })
  const countryMap = new Map(countries.map((c) => [c.id, c]))

  const stats = {
    totalBenchmarks,
    todayBenchmarks,
    publicBenchmarks,
    privateBenchmarks,
    totalProviders,
    topCountries: topCountries.map((c) => ({
      country: countryMap.get(c.countryId!) || null,
      count: c._count,
    })),
    topProviders,
    recentBenchmarks: recentBenchmarks.map((b) => ({
      ...b,
      totalScore: b.scores[0]?.totalScore ?? null,
      scores: undefined,
    })),
  }

  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stats))

  return apiResponse(stats)
}
