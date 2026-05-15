import { db } from '@/lib/db'
import { apiResponse } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage
  const countryCode = searchParams.get('country')
  const providerSlug = searchParams.get('provider')

  const where = {
    isActive: true,
    OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    ...(countryCode && { country: { code: countryCode } }),
    ...(providerSlug && { provider: { slug: providerSlug } }),
  }

  const [promotions, total] = await Promise.all([
    db.promotion.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { name: true, slug: true, logoUrl: true, websiteUrl: true } },
        country: { select: { code: true, name: true, flagEmoji: true } },
      },
    }),
    db.promotion.count({ where }),
  ])

  return apiResponse(promotions, {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}
