import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const passkeys = await db.passkeyCredential.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      deviceType: true,
      backedUp: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return apiResponse(passkeys)
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = z.object({ id: z.string() }).safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)

  const passkey = await db.passkeyCredential.findUnique({
    where: { id: parsed.data.id },
    select: { userId: true },
  })

  if (!passkey || passkey.userId !== session.user.id) return apiError('Not found', 404)

  await db.passkeyCredential.delete({ where: { id: parsed.data.id } })

  return apiResponse({ deleted: true })
}
