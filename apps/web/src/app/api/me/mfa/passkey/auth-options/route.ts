import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError } from '@/lib/utils'
import { generateAuthenticationOptions } from '@simplewebauthn/server'

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const passkeys = await db.passkeyCredential.findMany({
    where: { userId: session.user.id },
    select: { credentialId: true, transports: true },
  })

  if (passkeys.length === 0) return apiError('No passkeys registered', 400)

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
    allowCredentials: passkeys.map(p => ({
      id: p.credentialId,
      transports: p.transports ? (p.transports.split(',') as AuthenticatorTransport[]) : [],
    })),
  })

  const Redis = (await import('ioredis')).default
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  await redis.set(`otp:webauthn-auth:${session.user.id}`, options.challenge, 'EX', 300)
  redis.disconnect()

  return Response.json(options)
}
