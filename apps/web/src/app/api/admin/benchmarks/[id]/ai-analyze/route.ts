import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { benchmarkQueue } from '@/lib/queue'
import { apiError, apiResponse } from '@/lib/utils'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !['admin', 'super_admin'].includes(session.user.role ?? '')) {
    return apiError('Forbidden', 403)
  }

  const { id } = await params

  const benchmark = await db.benchmark.findUnique({ where: { id } })
  if (!benchmark) return apiError('Benchmark not found', 404)
  if (benchmark.status !== 'completed') return apiError('Benchmark not completed yet', 400)

  await benchmarkQueue.add('AiAnalysis', { benchmarkId: id }, { priority: 3 })

  return apiResponse({ queued: true, benchmarkId: id })
}
