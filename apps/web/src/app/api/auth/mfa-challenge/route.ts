import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { verifyTotpToken } from '@/lib/totp'
import { verifyOtp, generateOtp, storeOtp, hasOtpCooldown } from '@/lib/otp'
import { send2faEmail } from '@/lib/email'
import { z } from 'zod'

const verifySchema = z.object({ method: z.enum(['totp', 'email']), code: z.string() })

// POST ?action=send — send email 2FA code
// POST (default) — verify code and clear mfaRequired flag
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'send') {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, mfaEmailEnabled: true },
    })
    if (!user?.mfaEmailEnabled) return apiError('Email 2FA not enabled', 400)

    const cooldown = await hasOtpCooldown(`mfa:${user.email}`)
    if (cooldown > 0) return apiError(`Please wait ${cooldown}s before resending`, 429)

    const code = generateOtp(6)
    await storeOtp(`mfa:${user.email}`, code, 300) // 5 min TTL
    await send2faEmail(user.email, code)
    return apiResponse({ sent: true })
  }

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)

  const { method, code } = parsed.data
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, mfaTotpSecret: true, mfaTotpEnabled: true, mfaEmailEnabled: true },
  })
  if (!user) return apiError('User not found', 404)

  let valid = false
  if (method === 'totp') {
    if (!user.mfaTotpEnabled || !user.mfaTotpSecret) return apiError('TOTP not enabled', 400)
    valid = verifyTotpToken(user.mfaTotpSecret, code)
  } else if (method === 'email') {
    if (!user.mfaEmailEnabled) return apiError('Email 2FA not enabled', 400)
    valid = await verifyOtp(`mfa:${user.email}`, code)
  }

  if (!valid) return apiError('Invalid code', 400)

  return apiResponse({ verified: true })
}
