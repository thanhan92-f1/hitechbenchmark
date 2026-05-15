import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function checkDb(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

async function checkRedis(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    const Redis = (await import('ioredis')).default
    const r = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: 1, connectTimeout: 3000 })
    await r.ping()
    r.disconnect()
    return { ok: true, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

export async function GET() {
  const [db_, redis] = await Promise.all([checkDb(), checkRedis()])

  // Recent benchmark stats
  const [total, last24h, pending] = await Promise.all([
    db.benchmark.count(),
    db.benchmark.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    db.benchmark.count({ where: { status: { in: ['pending', 'processing'] } } }),
  ])

  const allOk = db_.ok && redis.ok
  const status = allOk ? 'operational' : db_.ok ? 'degraded' : 'down'

  const payload = {
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: { status: db_.ok ? 'operational' : 'down', latencyMs: db_.latencyMs },
      cache: { status: redis.ok ? 'operational' : 'down', latencyMs: redis.latencyMs },
      api: { status: 'operational' },
    },
    stats: {
      totalBenchmarks: total,
      benchmarksLast24h: last24h,
      pendingJobs: pending,
    },
  }

  return NextResponse.json(payload, {
    status: allOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
