import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'
import { z } from 'zod'

const createSchema = z.object({
  nickname: z.string().max(80).optional(),
  hostname: z.string().max(255).optional(),
  interval: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
})

function nextRunDate(interval: string): Date {
  const now = new Date()
  switch (interval) {
    case 'daily': now.setDate(now.getDate() + 1); break
    case 'monthly': now.setMonth(now.getMonth() + 1); break
    default: now.setDate(now.getDate() + 7)
  }
  return now
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const servers = await db.monitoredServer.findMany({
    where: { userId: session.user.id },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return apiResponse(servers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const count = await db.monitoredServer.count({ where: { userId: session.user.id } })
  if (count >= 5) return apiError('Max 5 monitored servers per account', 400)

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation failed', 422)

  const server = await db.monitoredServer.create({
    data: {
      userId: session.user.id,
      nickname: parsed.data.nickname,
      hostname: parsed.data.hostname,
      interval: parsed.data.interval,
      nextRunAt: nextRunDate(parsed.data.interval),
    },
  })

  return Response.json({ success: true, data: server }, { status: 201 })
}
