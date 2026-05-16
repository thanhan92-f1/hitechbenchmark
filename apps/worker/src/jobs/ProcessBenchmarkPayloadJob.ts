import { BenchmarkCategory, Prisma, PrismaClient } from '@hitechbenchmark/db'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})
const queue = new Queue('benchmark', { connection })

type BenchmarkResultCreateInput = {
  benchmarkId: string
  category: BenchmarkCategory
  metricName: string
  metricValue: number
  unit?: string
  metadata?: Prisma.InputJsonObject
}

function jsonObject(input: Record<string, unknown>): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value as Prisma.InputJsonValue]),
  ) as Prisma.InputJsonObject
}

function numericMetric(
  benchmarkId: string,
  category: BenchmarkCategory,
  source: Record<string, unknown>,
  key: string,
  metricName: string,
  unit?: string,
  metadata?: Prisma.InputJsonObject,
): BenchmarkResultCreateInput | null {
  const value = source[key]
  if (typeof value !== 'number' || Number.isNaN(value)) return null

  return {
    benchmarkId,
    category,
    metricName,
    metricValue: value,
    ...(unit ? { unit } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

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
    const diskMetricDefs: Array<[string, string, string]> = [
      ['dd_write_mbps', 'dd_write_mbps', 'MB/s'],
      ['dd_read_mbps', 'dd_read_mbps', 'MB/s'],
      ['fio_read_iops', 'fio_read_iops', 'IOPS'],
      ['fio_write_iops', 'fio_write_iops', 'IOPS'],
      ['fio_read_mbps', 'fio_read_mbps', 'MB/s'],
      ['fio_write_mbps', 'fio_write_mbps', 'MB/s'],
      ['fio_read_latency_ms', 'fio_read_latency_ms', 'ms'],
      ['fio_write_latency_ms', 'fio_write_latency_ms', 'ms'],
      ['fio_4k_qd1_read_iops', 'fio_4k_qd1_read_iops', 'IOPS'],
      ['fio_4k_qd1_read_latency_ms', 'fio_4k_qd1_read_latency_ms', 'ms'],
      ['fio_4k_qd32_read_iops', 'fio_4k_qd32_read_iops', 'IOPS'],
      ['fio_4k_qd32_write_iops', 'fio_4k_qd32_write_iops', 'IOPS'],
      ['fio_4k_qd32_read_latency_ms', 'fio_4k_qd32_read_latency_ms', 'ms'],
      ['fio_4k_qd32_write_latency_ms', 'fio_4k_qd32_write_latency_ms', 'ms'],
      ['fio_seq_read_mbps', 'fio_seq_read_mbps', 'MB/s'],
      ['fio_seq_write_mbps', 'fio_seq_write_mbps', 'MB/s'],
    ]

    await prisma.benchmarkResult.createMany({
      data: diskResults.flatMap((disk) => {
        const metadata = jsonObject({
          device: disk.device,
          model: disk.model,
          diskType: disk.disk_type,
          rotational: disk.rotational,
          scheduler: disk.scheduler,
          smartHealth: disk.smart_health,
          nvmeDetected: disk.nvme_detected,
          nvmeModel: disk.nvme_model,
          nvmeNamespaceCount: disk.nvme_namespace_count,
        })

        return diskMetricDefs
          .map(([key, metricName, unit]) => numericMetric(benchmarkId, BenchmarkCategory.disk, disk, key, metricName, unit, metadata))
          .filter((x): x is BenchmarkResultCreateInput => Boolean(x))
      }),
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
      ['sevenzip_mips', '7-Zip', 'MIPS'],
      ['gzip_mbps', 'Gzip', 'Mbps'],
      ['openssl_sha256_mbps', 'OpenSSL SHA256', 'MB/s'],
      ['openssl_aes256_mbps', 'OpenSSL AES-256', 'MB/s'],
    ]
    await prisma.benchmarkResult.createMany({
      data: cpuMetrics
        .filter(([key]) => cpuResults[key] != null)
        .map(([key, name, unit]) => ({
          benchmarkId,
          category: BenchmarkCategory.cpu,
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
      ['random_read_mbps', 'Random Read', 'MB/s'],
      ['random_write_mbps', 'Random Write', 'MB/s'],
    ]
    await prisma.benchmarkResult.createMany({
      data: memMetrics
        .filter(([key]) => memResults[key] != null)
        .map(([key, name, unit]) => ({
          benchmarkId,
          category: BenchmarkCategory.memory,
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
        { benchmarkId, category: BenchmarkCategory.security, metricName: 'firewall_detected', metricValue: security.firewall_detected ? 1 : 0 },
        { benchmarkId, category: BenchmarkCategory.security, metricName: 'selinux', metricValue: security.selinux ? 1 : 0 },
        { benchmarkId, category: BenchmarkCategory.security, metricName: 'apparmor', metricValue: security.apparmor ? 1 : 0 },
        { benchmarkId, category: BenchmarkCategory.security, metricName: 'fail2ban_active', metricValue: security.fail2ban_active ? 1 : 0 },
        { benchmarkId, category: BenchmarkCategory.security, metricName: 'ufw_rules_count', metricValue: typeof security.ufw_rules_count === 'number' ? security.ufw_rules_count : 0 },
        { benchmarkId, category: BenchmarkCategory.security, metricName: 'open_ports_count', metricValue: Array.isArray(security.open_ports) ? security.open_ports.length : 0 },
      ].map((result) => ({
        ...result,
        metadata: jsonObject({
          firewallName: security.firewall_name,
          ufwStatus: security.ufw_status,
          openPorts: security.open_ports,
          selinuxStatus: security.selinux_status,
          apparmorProfileCount: security.apparmor_profile_count,
          fail2banInstalled: security.fail2ban_installed,
          sshPermitRootLogin: security.ssh_permit_root_login,
          sshPasswordAuthentication: security.ssh_password_authentication,
          kernelLockdown: security.kernel_lockdown,
          kernelHardening: security.kernel_hardening,
          virtualizationType: security.virtualization_type,
          cloudProvider: security.cloud_provider,
        }),
      })),
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
        metadata: jsonObject({
          serverHost: n.server_host,
          ipVersion: n.ip_version,
          testType: n.test_type,
          protocol: n.protocol,
        }),
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
