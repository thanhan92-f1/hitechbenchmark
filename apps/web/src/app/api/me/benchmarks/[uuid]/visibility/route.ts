import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  visibility: z.enum(['public', 'private']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  const { uuid } = await params

  let body: unknown
  try { body = await request.json() } catch { return apiError('Invalid JSON', 400) }

  const validated = schema.safeParse(body)
  if (!validated.success) return apiError('Invalid visibility value', 422)

  const benchmark = await db.benchmark.findFirst({
    where: { uuid, userId: session.user.id, deletedAt: null },
  })

  if (!benchmark) return apiError('Benchmark not found', 404)

  const updated = await db.benchmark.update({
    where: { id: benchmark.id },
    data: { visibility: validated.data.visibility },
    select: { uuid: true, visibility: true },
  })

  return apiResponse(updated)
}
