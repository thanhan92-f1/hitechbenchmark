import { auth } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'
import { redis } from '@/lib/redis'
import { benchmarkQueue } from '@/lib/queue'

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

export async function GET() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return apiError('Unauthorized', 401)
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      benchmarkQueue.getWaitingCount(),
      benchmarkQueue.getActiveCount(),
      benchmarkQueue.getCompletedCount(),
      benchmarkQueue.getFailedCount(),
      benchmarkQueue.getDelayedCount(),
    ])

    const failedJobs = await benchmarkQueue.getFailed(0, 9)

    return apiResponse({
      queue: 'benchmark',
      counts: { waiting, active, completed, failed, delayed },
      recentFailed: failedJobs.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
        processedOn: j.processedOn,
      })),
    })
  } catch {
    return apiResponse({
      queue: 'benchmark',
      counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      recentFailed: [],
      error: 'Could not connect to Redis',
    })
  }
}
