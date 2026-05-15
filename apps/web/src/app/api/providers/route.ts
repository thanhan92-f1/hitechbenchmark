import { db } from '@/lib/db'
import { apiResponse } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage
  const q = searchParams.get('q')
  const countryCode = searchParams.get('country')

  const where = {
    isActive: true,
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { slug: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
    ...(countryCode && { country: { code: countryCode } }),
  }

  const [providers, total] = await Promise.all([
    db.provider.findMany({
      where,
      skip,
      take: perPage,
      orderBy: [{ benchmarkCount: 'desc' }, { avgScore: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        logoUrl: true,
        avgScore: true,
        uptimeRating: true,
        benchmarkCount: true,
        country: { select: { code: true, name: true, flagEmoji: true } },
        asn: { select: { asnNumber: true, name: true } },
      },
    }),
    db.provider.count({ where }),
  ])

  return apiResponse(providers, {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}
