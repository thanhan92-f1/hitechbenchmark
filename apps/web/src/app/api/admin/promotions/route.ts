import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'
import { z } from 'zod'

const ADMIN_ROLES = ['super_admin', 'admin']

async function checkAdmin() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) return null
  return session
}

const promotionSchema = z.object({
  providerId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  couponCode: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().max(10).default('USD'),
  countryId: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage
  const isActive = searchParams.get('active')

  const where = {
    ...(isActive === 'true' && { isActive: true }),
    ...(isActive === 'false' && { isActive: false }),
  }

  const [promotions, total] = await Promise.all([
    db.promotion.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { name: true, slug: true, logoUrl: true } },
        country: { select: { code: true, name: true } },
      },
    }),
    db.promotion.count({ where }),
  ])

  return apiResponse(promotions, {
    page, perPage, total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}

export async function POST(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = promotionSchema.safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const promo = await db.promotion.create({
    data: {
      ...validated.data,
      startsAt: validated.data.startsAt ? new Date(validated.data.startsAt) : null,
      endsAt: validated.data.endsAt ? new Date(validated.data.endsAt) : null,
    },
    include: { provider: { select: { name: true } } },
  })

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'promotion.create',
      entityType: 'Promotion',
      entityId: promo.id,
      newValues: validated.data,
    },
  })

  return Response.json({ success: true, data: promo }, { status: 201 })
}

export async function PUT(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return apiError('Promotion ID required', 400)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = promotionSchema.partial().safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const promo = await db.promotion.update({
    where: { id },
    data: {
      ...validated.data,
      ...(validated.data.startsAt && { startsAt: new Date(validated.data.startsAt) }),
      ...(validated.data.endsAt && { endsAt: new Date(validated.data.endsAt) }),
    },
  })

  return apiResponse(promo)
}

export async function DELETE(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return apiError('Promotion ID required', 400)

  await db.promotion.delete({ where: { id } })

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'promotion.delete',
      entityType: 'Promotion',
      entityId: id,
    },
  })

  return apiResponse({ deleted: true })
}
