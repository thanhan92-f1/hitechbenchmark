import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  const tokens = await db.apiToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, lastUsedAt: true, expiresAt: true, createdAt: true,
    },
  })

  return apiResponse(tokens)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = createSchema.safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  // Limit tokens per user
  const existingCount = await db.apiToken.count({
    where: { userId: session.user.id, revokedAt: null },
  })
  if (existingCount >= 10) {
    return apiError('Maximum of 10 active tokens allowed', 400)
  }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const expiresAt = validated.data.expiresInDays
    ? new Date(Date.now() + validated.data.expiresInDays * 86400 * 1000)
    : null

  const token = await db.apiToken.create({
    data: {
      userId: session.user.id,
      name: validated.data.name,
      tokenHash,
      expiresAt,
    },
    select: { id: true, name: true, expiresAt: true, createdAt: true },
  })

  // Return the raw token only once
  return Response.json({ success: true, data: { ...token, token: rawToken } }, { status: 201 })
}
