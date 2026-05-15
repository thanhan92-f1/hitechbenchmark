import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { benchmarks: true, apiTokens: true } },
    },
  })

  if (!user) return apiError('User not found', 404)
  return apiResponse(user)
}

const updateSchema = z.object({
  name: z.string().min(2).max(100),
})

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = updateSchema.safeParse(body)
  if (!validated.success) return apiError('Validation failed', 422)

  const user = await db.user.update({
    where: { id: session.user.id },
    data: validated.data,
    select: { id: true, name: true, email: true, role: true },
  })

  return apiResponse(user)
}
