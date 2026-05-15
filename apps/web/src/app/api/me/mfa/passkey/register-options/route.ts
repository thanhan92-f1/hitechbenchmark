import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError } from '@/lib/utils'
import { generateRegistrationOptions } from '@simplewebauthn/server'

const RP_NAME = 'HiTech Benchmark'
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const existingPasskeys = await db.passkeyCredential.findMany({
    where: { userId: session.user.id },
    select: { credentialId: true, transports: true },
  })

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(session.user.id),
    userName: session.user.email!,
    userDisplayName: session.user.name || session.user.email!,
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map(p => ({
      id: p.credentialId,
      transports: p.transports ? (p.transports.split(',') as AuthenticatorTransport[]) : [],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  const { storeOtp } = await import('@/lib/otp')
  await storeOtp(`webauthn-reg:${session.user.id}`, options.challenge, 300)

  return Response.json(options)
}
