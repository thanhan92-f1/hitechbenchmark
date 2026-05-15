import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { z } from 'zod'

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000'

const schema = z.object({
  response: z.any(),
  name: z.string().max(64).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)

  // Retrieve stored challenge
  const { verifyOtp } = await import('@/lib/otp')

  // Get raw challenge from Redis (we stored it without deletion, use get directly)
  const Redis = (await import('ioredis')).default
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  const expectedChallenge = await redis.get(`otp:webauthn-reg:${session.user.id}`)
  await redis.del(`otp:webauthn-reg:${session.user.id}`)
  redis.disconnect()

  if (!expectedChallenge) return apiError('Challenge expired', 400)

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: parsed.data.response as RegistrationResponseJSON,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    })
  } catch (err) {
    return apiError(`Verification failed: ${(err as Error).message}`, 400)
  }

  if (!verification.verified || !verification.registrationInfo) {
    return apiError('Registration not verified', 400)
  }

  const { credential } = verification.registrationInfo

  await db.passkeyCredential.create({
    data: {
      userId: session.user.id,
      credentialId: credential.id,
      credentialPublicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: verification.registrationInfo.credentialBackedUp,
      transports: (parsed.data.response.response?.transports || []).join(','),
      name: parsed.data.name || 'Passkey',
    },
  })

  return apiResponse({ registered: true })
}
