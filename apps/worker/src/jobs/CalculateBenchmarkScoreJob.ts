import { PrismaClient } from '@hitechbenchmark/db'
import { SCORING_WEIGHTS, SCORE_VERSION } from '@hitechbenchmark/shared'
import type { BenchmarkPayload } from '@hitechbenchmark/shared'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const _connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null })
const queue = new Queue('benchmark', { connection: _connection })

const SCORE_MAX = 100

function normalize(value: number, reference: number): number {
  return Math.min((value / reference) * SCORE_MAX, SCORE_MAX)
}

export async function calculateBenchmarkScore({ benchmarkId }: { benchmarkId: string }) {
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    include: {
      results: true,
      locations: true,
    },
  })

  if (!benchmark || !benchmark.rawPayload) return

  const payload = benchmark.rawPayload as unknown as BenchmarkPayload

  // CPU Score
  let cpuScore = 0
  const cpuResults = benchmark.results.filter((r) => r.category === 'cpu')
  const eps = cpuResults.find((r) => r.metricName === 'Events/s')?.metricValue
  const multiScore = cpuResults.find((r) => r.metricName === 'Sysbench Multi')?.metricValue
  if (eps) {
    const single = normalize(eps, 2000)
    const multi = multiScore ? normalize(multiScore, 2000 * 8) : single * (benchmark.cpuCores || 1) * 0.7
    cpuScore = single * 0.4 + multi * 0.6
  }

  // Disk Score
  let diskScore = 0
  const diskResults = benchmark.results.filter((r) => r.category === 'disk')
  const readIops = diskResults.find((r) => r.metricName === 'fio_read_iops')?.metricValue
  const writeIops = diskResults.find((r) => r.metricName === 'fio_write_iops')?.metricValue
  const readMbps = diskResults.find((r) => r.metricName === 'fio_read_mbps' || r.metricName === 'dd_read_mbps')?.metricValue
  const writeMbps = diskResults.find((r) => r.metricName === 'fio_write_mbps' || r.metricName === 'dd_write_mbps')?.metricValue
  if (readIops || writeMbps) {
    const iopsScore = ((normalize(readIops || 0, 50000) + normalize(writeIops || 0, 30000)) / 2)
    const throughput = ((normalize(readMbps || 0, 500) + normalize(writeMbps || 0, 300)) / 2)
    diskScore = iopsScore * 0.6 + throughput * 0.4
  }

  // Memory Score
  let memoryScore = 0
  const memResults = benchmark.results.filter((r) => r.category === 'memory')
  const memRead = memResults.find((r) => r.metricName === 'Read Speed')?.metricValue
  const memWrite = memResults.find((r) => r.metricName === 'Write Speed')?.metricValue
  if (memRead) {
    memoryScore = normalize(memRead, 10000) * 0.5 + normalize(memWrite || 0, 8000) * 0.5
  }

  // Network Score
  let networkScore = 0
  if (benchmark.locations.length > 0) {
    const locationScores = benchmark.locations
      .filter((l) => l.downloadMbps)
      .map((l) => normalize(l.downloadMbps || 0, 500) * 0.6 + normalize(l.uploadMbps || 0, 500) * 0.4)
    networkScore = locationScores.reduce((a, b) => a + b, 0) / Math.max(locationScores.length, 1)
  }

  // Security Score
  let securityScore = 50
  const secResults = benchmark.results.filter((r) => r.category === 'security')
  const firewall = secResults.find((r) => r.metricName === 'firewall_detected')?.metricValue
  const selinux = secResults.find((r) => r.metricName === 'selinux')?.metricValue
  const apparmor = secResults.find((r) => r.metricName === 'apparmor')?.metricValue
  if (firewall) securityScore += 20
  if (selinux || apparmor) securityScore += 30
  securityScore = Math.min(securityScore, SCORE_MAX)

  // Total weighted score
  const totalScore =
    cpuScore * SCORING_WEIGHTS.cpu +
    diskScore * SCORING_WEIGHTS.disk +
    networkScore * SCORING_WEIGHTS.network +
    memoryScore * SCORING_WEIGHTS.memory +
    securityScore * SCORING_WEIGHTS.security

  await prisma.benchmarkScore.create({
    data: {
      benchmarkId,
      cpuScore: Math.round(cpuScore * 10) / 10,
      diskScore: Math.round(diskScore * 10) / 10,
      memoryScore: Math.round(memoryScore * 10) / 10,
      networkScore: Math.round(networkScore * 10) / 10,
      securityScore: Math.round(securityScore * 10) / 10,
      totalScore: Math.round(totalScore * 10) / 10,
      scoreVersion: SCORE_VERSION,
    },
  })

  // Update benchmark status to completed
  await prisma.benchmark.update({
    where: { id: benchmarkId },
    data: { status: 'completed' },
  })

  // Update provider average score
  if (benchmark.providerId) {
    const avgResult = await prisma.benchmarkScore.aggregate({
      where: {
        benchmark: {
          providerId: benchmark.providerId,
          status: 'completed',
          visibility: 'public',
        },
      },
      _avg: { totalScore: true },
    })

    await prisma.provider.update({
      where: { id: benchmark.providerId },
      data: { avgScore: avgResult._avg.totalScore },
    })
  }

  // Enqueue post-score jobs
  await Promise.all([
    queue.add('DetectFakeBenchmark', { benchmarkId }, { priority: 4 }),
    queue.add('IssueDetection', { benchmarkId }, { priority: 5 }),
    queue.add('AiAnalysis', { benchmarkId }, { priority: 6, delay: 2000 }),
    queue.add('RefreshStatisticsCache', {}, { priority: 9 }),
  ])

  console.log(`[CalculateScore] Benchmark ${benchmarkId} scored: ${totalScore.toFixed(1)}`)
}
