import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { generateTotpSecret, generateTotpQr, generateTotpUri } from '@/lib/totp'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const secret = generateTotpSecret()
  const qr = await generateTotpQr(secret, session.user.email!)
  const uri = generateTotpUri(secret, session.user.email!)

  // Store secret temporarily (not enabled yet — user must verify first)
  await db.user.update({
    where: { id: session.user.id },
    data: { mfaTotpSecret: secret, mfaTotpEnabled: false },
  })

  return apiResponse({ secret, qr, uri })
}
