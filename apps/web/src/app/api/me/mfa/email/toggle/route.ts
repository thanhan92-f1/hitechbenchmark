import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEmailEnabled: true },
  })

  if (!user) return apiError('User not found', 404)

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: { mfaEmailEnabled: !user.mfaEmailEnabled },
    select: { mfaEmailEnabled: true },
  })

  return apiResponse({ mfaEmailEnabled: updated.mfaEmailEnabled })
}
