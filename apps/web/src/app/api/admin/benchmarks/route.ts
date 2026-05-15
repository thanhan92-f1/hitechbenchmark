import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'
import { z } from 'zod'

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator']

async function checkAdminAuth() {
  const session = await auth()
  if (!session?.user) return null
  if (!ADMIN_ROLES.includes(session.user.role)) return null
  return session
}

export async function GET(request: Request) {
  const session = await checkAdminAuth()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage
  const status = searchParams.get('status')
  const visibility = searchParams.get('visibility')
  const q = searchParams.get('q')

  const where = {
    ...(status && { status: status as 'pending' | 'processing' | 'completed' | 'failed' | 'flagged' }),
    ...(visibility && { visibility: visibility as 'public' | 'private' }),
    ...(q && {
      OR: [
        { hostname: { contains: q, mode: 'insensitive' as const } },
        { ipv4: { contains: q, mode: 'insensitive' as const } },
        { uuid: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
    deletedAt: null,
  }

  const [benchmarks, total] = await Promise.all([
    db.benchmark.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        uuid: true,
        hostname: true,
        ipv4: true,
        status: true,
        visibility: true,
        trustScore: true,
        createdAt: true,
        clientVersion: true,
        country: { select: { code: true, name: true } },
        provider: { select: { name: true, slug: true } },
        _count: { select: { flags: true } },
      },
    }),
    db.benchmark.count({ where }),
  ])

  return apiResponse(benchmarks, {
    page, perPage, total, totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total, hasPrev: page > 1,
  })
}

const patchSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'flagged']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
})

export async function PATCH(request: Request) {
  const session = await checkAdminAuth()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const uuid = searchParams.get('uuid')
  if (!uuid) return apiError('UUID required', 400)

  const body = await request.json()
  const validated = patchSchema.safeParse(body)
  if (!validated.success) return apiError('Invalid data', 422)

  const benchmark = await db.benchmark.update({
    where: { uuid, deletedAt: null },
    data: validated.data,
  })

  // Audit log
  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'benchmark.update',
      entityType: 'Benchmark',
      entityId: benchmark.id,
      newValues: validated.data,
      ipAddress: request.headers.get('x-forwarded-for') || '',
    },
  })

  return apiResponse(benchmark)
}

export async function DELETE(request: Request) {
  const session = await checkAdminAuth()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const uuid = searchParams.get('uuid')
  if (!uuid) return apiError('UUID required', 400)

  // Soft delete
  const benchmark = await db.benchmark.update({
    where: { uuid },
    data: { deletedAt: new Date() },
  })

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'benchmark.soft_delete',
      entityType: 'Benchmark',
      entityId: benchmark.id,
    },
  })

  return apiResponse({ deleted: true })
}
