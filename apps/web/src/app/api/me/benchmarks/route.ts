import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage

  const [benchmarks, total] = await Promise.all([
    db.benchmark.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
      select: {
        id: true, uuid: true, hostname: true, osName: true, cpuModel: true,
        cpuCores: true, ramTotalMb: true, virtualization: true, ipv4: true,
        city: true, status: true, visibility: true, trustScore: true,
        createdAt: true, publicSlug: true,
        country: { select: { code: true, name: true, flagEmoji: true } },
        provider: { select: { name: true, slug: true } },
        scores: { select: { totalScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { flags: true } },
      },
    }),
    db.benchmark.count({ where: { userId: session.user.id, deletedAt: null } }),
  ])

  const data = benchmarks.map((b) => ({
    ...b,
    totalScore: b.scores[0]?.totalScore ?? null,
    scores: undefined,
  }))

  return apiResponse(data, {
    page, perPage, total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}
