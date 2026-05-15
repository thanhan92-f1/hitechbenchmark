import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '9'))
  const skip = (page - 1) * perPage

  const provider = await db.provider.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!provider) return apiError('Provider not found', 404)

  const [benchmarks, total] = await Promise.all([
    db.benchmark.findMany({
      where: {
        providerId: provider.id,
        visibility: 'public',
        status: 'completed',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
      select: {
        id: true, uuid: true, hostname: true, osName: true, cpuModel: true,
        cpuCores: true, ramTotalMb: true, virtualization: true, ipv4: true,
        city: true, createdAt: true, publicSlug: true,
        country: { select: { code: true, name: true, flagEmoji: true } },
        provider: { select: { name: true, slug: true, logoUrl: true } },
        scores: { select: { totalScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    db.benchmark.count({
      where: { providerId: provider.id, visibility: 'public', status: 'completed', deletedAt: null },
    }),
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
