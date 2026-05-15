import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { z } from 'zod'

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000'

const schema = z.object({ response: z.any() })

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)

  const Redis = (await import('ioredis')).default
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  const expectedChallenge = await redis.get(`otp:webauthn-auth:${session.user.id}`)
  await redis.del(`otp:webauthn-auth:${session.user.id}`)
  redis.disconnect()

  if (!expectedChallenge) return apiError('Challenge expired', 400)

  const response = parsed.data.response as AuthenticationResponseJSON
  const passkey = await db.passkeyCredential.findUnique({
    where: { credentialId: response.id },
  })
  if (!passkey || passkey.userId !== session.user.id) return apiError('Passkey not found', 404)

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.credentialPublicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports ? (passkey.transports.split(',') as AuthenticatorTransport[]) : [],
      },
    })
  } catch (err) {
    return apiError(`Verification failed: ${(err as Error).message}`, 400)
  }

  if (!verification.verified) return apiError('Authentication not verified', 400)

  await db.passkeyCredential.update({
    where: { credentialId: passkey.credentialId },
    data: { counter: verification.authenticationInfo.newCounter },
  })

  return apiResponse({ verified: true })
}
