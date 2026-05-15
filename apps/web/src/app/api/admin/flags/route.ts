import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'
import { z } from 'zod'

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator']

async function checkAdmin() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) return null
  return session
}

export async function GET(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage
  const status = searchParams.get('status') || 'pending'

  const where = {
    ...(status !== 'all' && { status }),
  }

  const [flags, total] = await Promise.all([
    db.abuseFlag.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        benchmark: {
          select: {
            uuid: true, hostname: true, ipv4: true, trustScore: true,
            country: { select: { code: true, name: true } },
            provider: { select: { name: true } },
          },
        },
      },
    }),
    db.abuseFlag.count({ where }),
  ])

  return apiResponse(flags, {
    page, perPage, total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}

const resolveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
})

export async function PATCH(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return apiError('Flag ID required', 400)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = resolveSchema.safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const flag = await db.abuseFlag.findUnique({ where: { id } })
  if (!flag) return apiError('Flag not found', 404)

  const updated = await db.abuseFlag.update({
    where: { id },
    data: {
      status: validated.data.status,
      resolvedBy: session.user.id,
      metadata: { ...(flag.metadata as object || {}), note: validated.data.note },
    },
  })

  // If approved flag, lower trust score and potentially flag benchmark
  if (validated.data.status === 'approved') {
    await db.benchmark.update({
      where: { id: flag.benchmarkId },
      data: {
        trustScore: { decrement: 0.2 },
        status: 'flagged',
      },
    })
  }

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: `flag.${validated.data.status}`,
      entityType: 'AbuseFlag',
      entityId: id,
      newValues: validated.data,
    },
  })

  return apiResponse(updated)
}
