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

export async function GET() {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  const settings = await db.systemSetting.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  })

  return apiResponse(settings)
}

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

export async function PUT(request: Request) {
  const session = await checkAdmin()
  if (!session) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = updateSchema.safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const setting = await db.systemSetting.upsert({
    where: { key: validated.data.key },
    create: { key: validated.data.key, value: validated.data.value as object },
    update: { value: validated.data.value as object },
  })

  await db.adminAuditLog.create({
    data: {
      adminUserId: session.user.id,
      action: 'system_setting.update',
      entityType: 'SystemSetting',
      entityId: setting.id,
      newValues: { key: validated.data.key, value: validated.data.value as object },
    },
  })

  return apiResponse(setting)
}
