import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ADMIN_ROLES = ['super_admin', 'admin']

const planSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  vcpu: z.number().int().positive().nullable().optional(),
  ramGb: z.number().positive().nullable().optional(),
  diskGb: z.number().positive().nullable().optional(),
  diskType: z.string().max(20).nullable().optional(),
  bandwidthTb: z.number().positive().nullable().optional(),
  priceUsd: z.number().positive().nullable().optional(),
  pricingModel: z.string().max(50).nullable().optional(),
  regionCode: z.string().max(20).nullable().optional(),
  isActive: z.boolean().optional(),
  sourceUrl: z.string().url().nullable().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) return apiError('Unauthorized', 401)

  const { slug } = await params
  const provider = await db.provider.findUnique({ where: { slug }, select: { id: true } })
  if (!provider) return apiError('Provider not found', 404)

  const plans = await db.providerPlan.findMany({
    where: { providerId: provider.id },
    orderBy: [{ isActive: 'desc' }, { priceUsd: 'asc' }],
  })

  return apiResponse(plans)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) return apiError('Unauthorized', 401)

  const { slug } = await params
  const provider = await db.provider.findUnique({ where: { slug }, select: { id: true } })
  if (!provider) return apiError('Provider not found', 404)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = planSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation failed', 422)

  const plan = await db.providerPlan.create({
    data: {
      providerId: provider.id,
      ...parsed.data,
      isActive: parsed.data.isActive ?? true,
    },
  })

  return NextResponse.json({ success: true, data: plan }, { status: 201 })
}
