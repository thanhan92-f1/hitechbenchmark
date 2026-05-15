import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { apiResponse, apiError } from '@/lib/utils'
import { generateOtp, storeOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const validated = registerSchema.safeParse(body)
  if (!validated.success) {
    return apiError('Validation failed', 422, validated.error.flatten().fieldErrors as Record<string, string[]>)
  }

  const { name, email, password } = validated.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return apiError('Email already registered', 409)
  }

  const passwordHash = await hash(password, 12)

  const user = await db.user.create({
    data: { name, email, password: passwordHash, isEmailVerified: false },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  // Generate and send OTP verification email
  const otp = generateOtp(6)
  await storeOtp(`email-verify:${email}`, otp, 600) // 10 min TTL
  await sendOtpEmail(email, otp)

  return Response.json({ success: true, data: { ...user, requiresVerification: true } }, { status: 201 })
}
