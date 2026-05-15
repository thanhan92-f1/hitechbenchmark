import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  const { id } = await params

  const token = await db.apiToken.findFirst({
    where: { id, userId: session.user.id, revokedAt: null },
  })

  if (!token) return apiError('Token not found', 404)

  await db.apiToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  })

  return apiResponse({ revoked: true })
}
