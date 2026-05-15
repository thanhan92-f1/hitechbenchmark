import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { z } from 'zod'

const ADMIN_ROLES = ['super_admin', 'admin']

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; planId: string }> },
) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) return apiError('Unauthorized', 401)

  const { planId } = await params

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation failed', 422)

  const plan = await db.providerPlan.update({
    where: { id: planId },
    data: parsed.data,
  })

  return apiResponse(plan)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; planId: string }> },
) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) return apiError('Unauthorized', 401)

  const { planId } = await params

  await db.providerPlan.delete({ where: { id: planId } })

  return apiResponse({ deleted: true })
}
