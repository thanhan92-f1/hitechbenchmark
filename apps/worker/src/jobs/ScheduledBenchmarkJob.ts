import { PrismaClient } from '@hitechbenchmark/db'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})
const queue = new Queue('benchmark', { connection })

function nextRunDate(interval: string): Date {
  const now = new Date()
  switch (interval) {
    case 'daily':
      now.setDate(now.getDate() + 1)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
    default: // weekly
      now.setDate(now.getDate() + 7)
  }
  return now
}

export async function processScheduledBenchmarks() {
  const due = await prisma.monitoredServer.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: new Date() },
    },
    include: { user: { select: { id: true, email: true } } },
  })

  if (due.length === 0) {
    console.log('[ScheduledBenchmark] No servers due for monitoring')
    return
  }

  for (const server of due) {
    await queue.add('TriggerMonitoredBenchmark', {
      monitoredServerId: server.id,
      userId: server.userId,
      hostname: server.hostname,
    }, { priority: 8 })

    await prisma.monitoredServer.update({
      where: { id: server.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRunDate(server.interval),
      },
    })
  }

  console.log(`[ScheduledBenchmark] Triggered ${due.length} monitoring job(s)`)
}

export async function recordMonitoringResult({
  monitoredServerId,
  benchmarkId,
}: {
  monitoredServerId: string
  benchmarkId: string
}) {
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    include: { scores: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })

  if (!benchmark || !benchmark.scores[0]) return

  const score = benchmark.scores[0]

  const previous = await prisma.monitoringResult.findFirst({
    where: { monitoredServerId },
    orderBy: { createdAt: 'desc' },
  })

  const scoreChange = previous?.totalScore != null && score.totalScore != null
    ? score.totalScore - previous.totalScore
    : null

  await prisma.monitoringResult.create({
    data: {
      monitoredServerId,
      benchmarkId,
      totalScore: score.totalScore,
      cpuScore: score.cpuScore,
      diskScore: score.diskScore,
      networkScore: score.networkScore,
      memoryScore: score.memoryScore,
      securityScore: score.securityScore,
      scoreChange,
      status: 'completed',
    },
  })

  if (scoreChange !== null && scoreChange < -10) {
    console.warn(`[ScheduledBenchmark] Server ${monitoredServerId} score dropped by ${Math.abs(scoreChange).toFixed(1)} points!`)
  }

  console.log(`[ScheduledBenchmark] Recorded monitoring result for ${monitoredServerId}`)
}
