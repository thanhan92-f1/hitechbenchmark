import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export async function refreshStatisticsCache(_data: unknown) {
  // Invalidate cached statistics so they get recalculated on next request
  const keys = [
    'stats:overview',
    'rankings:top100:1:20',
    'rankings:top100:1:50',
  ]

  await Promise.all(keys.map((k) => redis.del(k)))
  console.log(`[RefreshStatsCache] Cleared ${keys.length} cache keys`)
}
