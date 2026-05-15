import { PrismaClient } from '@hitechbenchmark/db'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})
const queue = new Queue('benchmark', { connection })

export async function processBenchmarkPayload({ benchmarkId }: { benchmarkId: string }) {
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
  })

  if (!benchmark) {
    throw new Error(`Benchmark ${benchmarkId} not found`)
  }

  if (benchmark.status === 'flagged') {
    console.log(`[ProcessPayload] Benchmark ${benchmarkId} is flagged, skipping enrichment`)
    return
  }

  // Update status to processing
  await prisma.benchmark.update({
    where: { id: benchmarkId },
    data: { status: 'processing' },
  })

  const raw = benchmark.rawPayload as Record<string, unknown> | null
  if (!raw) {
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: { status: 'failed' },
    })
    throw new Error('No raw payload found')
  }

  // Store disk benchmark results
  const diskResults = (raw.disk_results as Record<string, unknown>[]) || []
  if (diskResults.length > 0) {
    await prisma.benchmarkResult.createMany({
      data: diskResults.flatMap((disk) =>
        [
          disk.dd_write_mbps != null && { category: 'disk', metricName: 'dd_write_mbps', metricValue: disk.dd_write_mbps as number, unit: 'MB/s' },
          disk.dd_read_mbps != null && { category: 'disk', metricName: 'dd_read_mbps', metricValue: disk.dd_read_mbps as number, unit: 'MB/s' },
          disk.fio_read_iops != null && { category: 'disk', metricName: 'fio_read_iops', metricValue: disk.fio_read_iops as number, unit: 'IOPS' },
          disk.fio_write_iops != null && { category: 'disk', metricName: 'fio_write_iops', metricValue: disk.fio_write_iops as number, unit: 'IOPS' },
          disk.fio_read_mbps != null && { category: 'disk', metricName: 'fio_read_mbps', metricValue: disk.fio_read_mbps as number, unit: 'MB/s' },
          disk.fio_write_mbps != null && { category: 'disk', metricName: 'fio_write_mbps', metricValue: disk.fio_write_mbps as number, unit: 'MB/s' },
        ].filter((x): x is { category: 'disk'; metricName: string; metricValue: number; unit: string } => Boolean(x))
          .map((r) => ({ ...r, benchmarkId })),
      ),
    })
  }

  // Store CPU results
  const cpuResults = raw.cpu_results as Record<string, unknown>
  if (cpuResults) {
    const cpuMetrics = [
      ['sysbench_single_score', 'Sysbench Single', 'events/s'],
      ['sysbench_multi_score', 'Sysbench Multi', 'events/s'],
      ['events_per_second', 'Events/s', 'eps'],
      ['compression_score', 'Compression', 'MB/s'],
    ]
    await prisma.benchmarkResult.createMany({
      data: cpuMetrics
        .filter(([key]) => cpuResults[key] != null)
        .map(([key, name, unit]) => ({
          benchmarkId,
          category: 'cpu' as const,
          metricName: name,
          metricValue: cpuResults[key] as number,
          unit,
        })),
    })
  }

  // Store memory results
  const memResults = raw.memory_results as Record<string, unknown>
  if (memResults) {
    const memMetrics = [
      ['read_speed_mbps', 'Read Speed', 'MB/s'],
      ['write_speed_mbps', 'Write Speed', 'MB/s'],
      ['latency_ns', 'Latency', 'ns'],
    ]
    await prisma.benchmarkResult.createMany({
      data: memMetrics
        .filter(([key]) => memResults[key] != null)
        .map(([key, name, unit]) => ({
          benchmarkId,
          category: 'memory' as const,
          metricName: name,
          metricValue: memResults[key] as number,
          unit,
        })),
    })
  }

  // Store security results
  const security = raw.security as Record<string, unknown>
  if (security) {
    await prisma.benchmarkResult.createMany({
      data: [
        { benchmarkId, category: 'security' as const, metricName: 'firewall_detected', metricValue: security.firewall_detected ? 1 : 0 },
        { benchmarkId, category: 'security' as const, metricName: 'selinux', metricValue: security.selinux ? 1 : 0 },
        { benchmarkId, category: 'security' as const, metricName: 'apparmor', metricValue: security.apparmor ? 1 : 0 },
      ],
    })
  }

  // Store network speed tests
  const networkResults = (raw.network_results as Record<string, unknown>[]) || []
  if (networkResults.length > 0) {
    await prisma.benchmarkLocation.createMany({
      data: networkResults.map((n) => ({
        benchmarkId,
        testLocation: n.location as string,
        downloadMbps: n.download_mbps as number | null,
        uploadMbps: n.upload_mbps as number | null,
        pingMs: n.ping_ms as number | null,
        jitterMs: n.jitter_ms as number | null,
      })),
    })
  }

  // Enqueue follow-up jobs
  await Promise.all([
    queue.add('EnrichGeoIp', { benchmarkId }, { priority: 2 }),
    queue.add('DetectProvider', { benchmarkId }, { priority: 2 }),
    queue.add('CalculateBenchmarkScore', { benchmarkId }, { priority: 3, delay: 2000 }),
  ])

  console.log(`[ProcessPayload] Benchmark ${benchmarkId} parsed, enrichment jobs enqueued`)
}
