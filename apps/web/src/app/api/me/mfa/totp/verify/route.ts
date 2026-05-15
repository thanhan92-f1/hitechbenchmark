import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { verifyTotpToken } from '@/lib/totp'
import { z } from 'zod'

const schema = z.object({ token: z.string().length(6) })

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError('Invalid token', 400)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mfaTotpSecret: true },
  })

  if (!user?.mfaTotpSecret) return apiError('TOTP not set up', 400)

  const valid = verifyTotpToken(user.mfaTotpSecret, parsed.data.token)
  if (!valid) return apiError('Invalid token', 400)

  await db.user.update({
    where: { id: session.user.id },
    data: { mfaTotpEnabled: true },
  })

  return apiResponse({ enabled: true })
}
