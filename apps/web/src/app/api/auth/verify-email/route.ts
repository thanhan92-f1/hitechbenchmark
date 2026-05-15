import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { verifyOtp, generateOtp, storeOtp, hasOtpCooldown } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'
import { z } from 'zod'

const verifySchema = z.object({ email: z.string().email(), otp: z.string().length(6) })
const resendSchema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') // 'verify' | 'resend'

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  if (action === 'resend') {
    const parsed = resendSchema.safeParse(body)
    if (!parsed.success) return apiError('Invalid email', 400)
    const { email } = parsed.data

    const user = await db.user.findUnique({ where: { email }, select: { id: true, isEmailVerified: true } })
    if (!user) return apiError('Email not found', 404)
    if (user.isEmailVerified) return apiError('Already verified', 400)

    const cooldown = await hasOtpCooldown(`email-verify:${email}`)
    if (cooldown > 0) return apiError(`Please wait ${cooldown} seconds before resending`, 429)

    const otp = generateOtp(6)
    await storeOtp(`email-verify:${email}`, otp, 600)
    await sendOtpEmail(email, otp)

    return apiResponse({ sent: true })
  }

  // Default: verify
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)
  const { email, otp } = parsed.data

  const user = await db.user.findUnique({ where: { email }, select: { id: true, isEmailVerified: true } })
  if (!user) return apiError('Email not found', 404)
  if (user.isEmailVerified) return apiResponse({ alreadyVerified: true })

  const valid = await verifyOtp(`email-verify:${email}`, otp)
  if (!valid) return apiError('Invalid or expired code', 400)

  await db.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifiedAt: new Date() },
  })

  return apiResponse({ verified: true })
}
