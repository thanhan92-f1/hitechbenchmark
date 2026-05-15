import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError, slugify } from '@/lib/utils'
import { z } from 'zod'

const ADMIN_ROLES = ['super_admin', 'admin']

async function checkAdminAuth() {
  const session = await auth()
  if (!session?.user) return null
  if (!ADMIN_ROLES.includes(session.user.role)) return null
  return session
}

export async function GET() {
  const session = await checkAdminAuth()
  if (!session) return apiError('Unauthorized', 401)

  const providers = await db.provider.findMany({
    orderBy: { benchmarkCount: 'desc' },
    include: {
      country: true,
      asn: { select: { asnNumber: true, name: true } },
      _count: { select: { benchmarks: true, promotions: true } },
    },
  })

  return apiResponse(providers)
}

const providerSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  countryId: z.string().optional(),
  asnId: z.string().optional(),
  uptimeRating: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
})

export async function POST(request: Request) {
  const session = await checkAdminAuth()
  if (!session) return apiError('Unauthorized', 401)

  const body = await request.json()
  const validated = providerSchema.safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const data = validated.data
  const slug = data.slug || slugify(data.name)

  const provider = await db.provider.create({
    data: { ...data, slug },
  })

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'provider.create',
      entityType: 'Provider',
      entityId: provider.id,
      newValues: data,
    },
  })

  return Response.json({ success: true, data: provider }, { status: 201 })
}

export async function PUT(request: Request) {
  const session = await checkAdminAuth()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return apiError('Provider ID required', 400)

  const body = await request.json()
  const validated = providerSchema.partial().safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const existing = await db.provider.findUnique({ where: { id } })
  if (!existing) return apiError('Provider not found', 404)

  const provider = await db.provider.update({
    where: { id },
    data: validated.data,
  })

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'provider.update',
      entityType: 'Provider',
      entityId: id,
      oldValues: existing,
      newValues: validated.data,
    },
  })

  return apiResponse(provider)
}
