import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { apiResponse, apiError } from '@/lib/utils'

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

export async function GET() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return apiError('Unauthorized', 401)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalBenchmarks,
    todayBenchmarks,
    pendingBenchmarks,
    flaggedBenchmarks,
    failedBenchmarks,
    totalProviders,
    totalUsers,
    openFlags,
  ] = await Promise.all([
    db.benchmark.count({ where: { deletedAt: null } }),
    db.benchmark.count({ where: { deletedAt: null, createdAt: { gte: today } } }),
    db.benchmark.count({ where: { deletedAt: null, status: 'pending' } }),
    db.benchmark.count({ where: { deletedAt: null, status: 'flagged' } }),
    db.benchmark.count({ where: { deletedAt: null, status: 'failed' } }),
    db.provider.count({ where: { isActive: true } }),
    db.user.count(),
    db.abuseFlag.count({ where: { status: 'pending' } }),
  ])

  // Queue stats from Redis
  let queueStats = { waiting: 0, active: 0, failed: 0 }
  try {
    const [waiting, active, failed] = await Promise.all([
      redis.llen('bull:benchmark:wait'),
      redis.llen('bull:benchmark:active'),
      redis.llen('bull:benchmark:failed'),
    ])
    queueStats = { waiting, active, failed }
  } catch {
    // ignore redis errors
  }

  return apiResponse({
    benchmarks: {
      total: totalBenchmarks,
      today: todayBenchmarks,
      pending: pendingBenchmarks,
      flagged: flaggedBenchmarks,
      failed: failedBenchmarks,
    },
    providers: totalProviders,
    users: totalUsers,
    openFlags,
    queue: queueStats,
  })
}
