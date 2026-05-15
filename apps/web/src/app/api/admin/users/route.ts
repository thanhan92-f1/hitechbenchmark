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

export async function GET(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage
  const q = searchParams.get('q')
  const role = searchParams.get('role')

  const where = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
    ...(role && { role: role as 'user' | 'moderator' | 'support' | 'admin' | 'super_admin' }),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        _count: { select: { benchmarks: true, apiTokens: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return apiResponse(users, {
    page, perPage, total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}

const patchSchema = z.object({
  role: z.enum(['user', 'moderator', 'support', 'admin', 'super_admin']).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return apiError('User ID required', 400)

  if (id === session.user.id) return apiError('Cannot modify your own account', 400)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = patchSchema.safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const existing = await db.user.findUnique({ where: { id } })
  if (!existing) return apiError('User not found', 404)

  // Prevent demoting another super_admin
  if (existing.role === 'super_admin' && session.user.role !== 'super_admin') {
    return apiError('Cannot modify super_admin users', 403)
  }

  const user = await db.user.update({
    where: { id },
    data: validated.data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'user.update',
      entityType: 'User',
      entityId: id,
      oldValues: { role: existing.role, isActive: existing.isActive },
      newValues: validated.data,
      ipAddress: request.headers.get('x-forwarded-for') || '',
    },
  })

  return apiResponse(user)
}
