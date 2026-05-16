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

function calcStabilityBonus(payload: BenchmarkPayload): number {
  let bonus = 0
  const loadAverage = payload.system.load_average
  const uptime = payload.system.uptime_seconds

  if (loadAverage) {
    const load1Min = Number(loadAverage.split(',')[0] || 0)
    const cpuCount = payload.system.cpu_threads || payload.system.cpu_cores || 1
    const loadRatio = Number.isFinite(load1Min) ? load1Min / cpuCount : 0
    // Low load during test = stable system = +bonus
    if (loadRatio < 0.3) bonus += 3
    else if (loadRatio < 0.6) bonus += 1
    else if (loadRatio > 1.5) bonus -= 5
    else if (loadRatio > 1.0) bonus -= 2
  }

  if (uptime != null) {
    const days = uptime / 86400
    if (days > 30) bonus += 2
    else if (days < 1) bonus -= 3
  }

  return Math.max(-10, Math.min(10, bonus))
}

function calcConfidenceLevel(payload: BenchmarkPayload, resultCount: number): 'low' | 'medium' | 'high' {
  const hasDisks = payload.disk_results.length > 0
  const hasNetwork = payload.network_results.length > 0

  if (resultCount >= 15 && hasDisks && hasNetwork) return 'high'
  if (resultCount >= 7) return 'medium'
  return 'low'
}

async function calcRegionPercentile(benchmarkId: string, countryId: string | null, totalScore: number): Promise<number | null> {
  if (!countryId) return null
  try {
    const scores = await prisma.benchmarkScore.findMany({
      where: {
        benchmark: { countryId, status: 'completed', visibility: 'public' },
        NOT: { benchmarkId },
      },
      select: { totalScore: true },
      take: 500,
      orderBy: { createdAt: 'desc' },
    })
    if (scores.length === 0) return 50
    const below = scores.filter(s => (s.totalScore ?? 0) < totalScore).length
    return Math.round((below / scores.length) * 100)
  } catch {
    return null
  }
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
  const sha256 = cpuResults.find((r) => r.metricName === 'OpenSSL SHA256')?.metricValue
  const aes256 = cpuResults.find((r) => r.metricName === 'OpenSSL AES-256')?.metricValue
  const sevenZip = cpuResults.find((r) => r.metricName === '7-Zip')?.metricValue
  const gzip = cpuResults.find((r) => r.metricName === 'Gzip')?.metricValue
  if (eps || multiScore || sha256 || aes256 || sevenZip || gzip) {
    const single = normalize(eps || 0, 2000)
    const multi = multiScore ? normalize(multiScore, 2000 * 8) : single * Math.min(benchmark.cpuThreads || benchmark.cpuCores || 1, 8) * 0.7
    const cryptoScore = ((normalize(sha256 || 0, 3000) + normalize(aes256 || 0, 2500)) / 2)
    const compressionScore = Math.max(normalize(sevenZip || 0, 50000), normalize(gzip || 0, 1500))
    cpuScore = single * 0.25 + multi * 0.45 + cryptoScore * 0.15 + compressionScore * 0.15
  }

  // Disk Score
  let diskScore = 0
  const diskResults = benchmark.results.filter((r) => r.category === 'disk')
  const readIops = diskResults.find((r) => r.metricName === 'fio_read_iops')?.metricValue
  const writeIops = diskResults.find((r) => r.metricName === 'fio_write_iops')?.metricValue
  const qd1Iops = diskResults.find((r) => r.metricName === 'fio_4k_qd1_read_iops')?.metricValue
  const qd32ReadIops = diskResults.find((r) => r.metricName === 'fio_4k_qd32_read_iops')?.metricValue
  const qd32WriteIops = diskResults.find((r) => r.metricName === 'fio_4k_qd32_write_iops')?.metricValue
  const readMbps = diskResults.find((r) => r.metricName === 'fio_read_mbps' || r.metricName === 'dd_read_mbps')?.metricValue
  const writeMbps = diskResults.find((r) => r.metricName === 'fio_write_mbps' || r.metricName === 'dd_write_mbps')?.metricValue
  const seqReadMbps = diskResults.find((r) => r.metricName === 'fio_seq_read_mbps')?.metricValue
  const seqWriteMbps = diskResults.find((r) => r.metricName === 'fio_seq_write_mbps')?.metricValue
  const qd1Latency = diskResults.find((r) => r.metricName === 'fio_4k_qd1_read_latency_ms')?.metricValue
  if (readIops || writeMbps || qd1Iops || seqReadMbps) {
    const legacyIopsScore = ((normalize(readIops || qd32ReadIops || 0, 50000) + normalize(writeIops || qd32WriteIops || 0, 30000)) / 2)
    const qd1Score = normalize(qd1Iops || 0, 12000)
    const throughput = ((normalize(readMbps || seqReadMbps || 0, 1000) + normalize(writeMbps || seqWriteMbps || 0, 800)) / 2)
    const latencyScore = qd1Latency ? Math.max(0, SCORE_MAX - normalize(qd1Latency, 5)) : throughput
    diskScore = legacyIopsScore * 0.35 + qd1Score * 0.25 + throughput * 0.25 + latencyScore * 0.15
  }

  // Memory Score
  let memoryScore = 0
  const memResults = benchmark.results.filter((r) => r.category === 'memory')
  const memRead = memResults.find((r) => r.metricName === 'Read Speed')?.metricValue
  const memWrite = memResults.find((r) => r.metricName === 'Write Speed')?.metricValue
  const memRandomRead = memResults.find((r) => r.metricName === 'Random Read')?.metricValue
  const memRandomWrite = memResults.find((r) => r.metricName === 'Random Write')?.metricValue
  const memLatency = memResults.find((r) => r.metricName === 'Latency')?.metricValue
  if (memRead || memRandomRead) {
    const sequential = normalize(memRead || 0, 10000) * 0.5 + normalize(memWrite || 0, 8000) * 0.5
    const random = normalize(memRandomRead || 0, 3000) * 0.5 + normalize(memRandomWrite || 0, 2500) * 0.5
    const latency = memLatency ? Math.max(0, SCORE_MAX - normalize(memLatency, 250000)) : sequential
    memoryScore = sequential * 0.5 + random * 0.3 + latency * 0.2
  }

  // Network Score
  let networkScore = 0
  if (benchmark.locations.length > 0) {
    const locationScores = benchmark.locations
      .filter((l) => l.downloadMbps)
      .map((l) => {
        const latencyScore = l.pingMs ? Math.max(0, SCORE_MAX - normalize(l.pingMs, 250)) : 50
        return normalize(l.downloadMbps || 0, 500) * 0.5 + normalize(l.uploadMbps || 0, 500) * 0.3 + latencyScore * 0.2
      })
    networkScore = locationScores.reduce((a, b) => a + b, 0) / Math.max(locationScores.length, 1)
  }

  // Security Score
  let securityScore = 50
  const secResults = benchmark.results.filter((r) => r.category === 'security')
  const firewall = secResults.find((r) => r.metricName === 'firewall_detected')?.metricValue
  const selinux = secResults.find((r) => r.metricName === 'selinux')?.metricValue
  const apparmor = secResults.find((r) => r.metricName === 'apparmor')?.metricValue
  const fail2ban = secResults.find((r) => r.metricName === 'fail2ban_active')?.metricValue
  const openPortsCount = secResults.find((r) => r.metricName === 'open_ports_count')?.metricValue
  if (firewall) securityScore += 20
  if (selinux || apparmor) securityScore += 20
  if (fail2ban) securityScore += 10
  if ((openPortsCount || 0) > 8) securityScore -= 15
  else if ((openPortsCount || 0) > 4) securityScore -= 5
  securityScore = Math.min(securityScore, SCORE_MAX)

  // Smart Scoring: stability bonus
  const stabilityBonus = calcStabilityBonus(payload)

  // Total weighted score with stability adjustment
  const baseTotal =
    cpuScore * SCORING_WEIGHTS.cpu +
    diskScore * SCORING_WEIGHTS.disk +
    networkScore * SCORING_WEIGHTS.network +
    memoryScore * SCORING_WEIGHTS.memory +
    securityScore * SCORING_WEIGHTS.security

  const totalScore = Math.max(0, Math.min(SCORE_MAX, baseTotal + stabilityBonus))

  // Confidence level based on result richness
  const confidenceLevel = calcConfidenceLevel(payload, benchmark.results.length)

  // Region percentile (async, don't block)
  const regionPercentile = await calcRegionPercentile(benchmarkId, benchmark.countryId, totalScore)

  await prisma.benchmarkScore.create({
    data: {
      benchmarkId,
      cpuScore: Math.round(cpuScore * 10) / 10,
      diskScore: Math.round(diskScore * 10) / 10,
      memoryScore: Math.round(memoryScore * 10) / 10,
      networkScore: Math.round(networkScore * 10) / 10,
      securityScore: Math.round(securityScore * 10) / 10,
      totalScore: Math.round(totalScore * 10) / 10,
      stabilityBonus: Math.round(stabilityBonus * 10) / 10,
      confidenceLevel,
      regionPercentile,
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

  console.log(`[CalculateScore] Benchmark ${benchmarkId} scored: ${totalScore.toFixed(1)} (confidence: ${confidenceLevel}, stability: ${stabilityBonus > 0 ? '+' : ''}${stabilityBonus}, percentile: ${regionPercentile ?? 'n/a'})`)
}
