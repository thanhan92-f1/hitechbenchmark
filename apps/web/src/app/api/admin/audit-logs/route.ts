import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

const ADMIN_ROLES = ['super_admin', 'admin']

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return apiError('Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') || '20'))
  const skip = (page - 1) * perPage
  const action = searchParams.get('action')
  const entityType = searchParams.get('entity_type')

  const where = {
    ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
    ...(entityType && { entityType }),
  }

  const [logs, total] = await Promise.all([
    db.adminAuditLog.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: { select: { name: true, email: true } },
      },
    }),
    db.adminAuditLog.count({ where }),
  ])

  return apiResponse(logs, {
    page, perPage, total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}
