import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const { id } = await params
  const server = await db.monitoredServer.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!server) return apiError('Not found', 404)

  await db.monitoredServer.delete({ where: { id } })
  return apiResponse({ deleted: true })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const { id } = await params
  const server = await db.monitoredServer.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!server) return apiError('Not found', 404)

  const body = await req.json()
  const updated = await db.monitoredServer.update({
    where: { id },
    data: {
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      nickname: body.nickname !== undefined ? String(body.nickname) : undefined,
      interval: ['daily', 'weekly', 'monthly'].includes(body.interval) ? body.interval : undefined,
    },
  })

  return apiResponse(updated)
}
