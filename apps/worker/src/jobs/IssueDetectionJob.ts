import { Prisma, PrismaClient } from '@hitechbenchmark/db'

const prisma = new PrismaClient()

export interface PerformanceIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  metric?: string
  value?: number
}

export async function detectPerformanceIssues({ benchmarkId }: { benchmarkId: string }) {
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    include: {
      results: true,
      scores: { orderBy: { createdAt: 'desc' }, take: 1 },
      locations: true,
    },
  })

  if (!benchmark || !benchmark.scores[0]) return

  const issues: PerformanceIssue[] = []
  const score = benchmark.scores[0]
  const results = benchmark.results

  const get = (name: string) => results.find(r => r.metricName === name)?.metricValue

  // ── CPU checks ────────────────────────────────────────────────────────────

  const cpuSingle = get('Events/s') ?? get('Sysbench Single')
  const cpuMulti = get('Sysbench Multi')

  if (cpuSingle && cpuMulti && benchmark.cpuCores) {
    const expectedMulti = cpuSingle * benchmark.cpuCores * 0.7
    if (cpuMulti < expectedMulti * 0.5) {
      issues.push({
        type: 'cpu_steal',
        severity: 'high',
        title: 'CPU Steal Detected',
        description: `Multi-thread score (${cpuMulti.toFixed(0)}) is less than 50% of expected (${expectedMulti.toFixed(0)}). Likely CPU steal from noisy neighbor.`,
        metric: 'Sysbench Multi',
        value: cpuMulti,
      })
    }
  }

  if (score.cpuScore !== null && score.cpuScore < 20) {
    issues.push({
      type: 'cpu_weak',
      severity: 'medium',
      title: 'Very Low CPU Performance',
      description: `CPU score ${score.cpuScore} is critically low. This VPS may be oversold or heavily throttled.`,
      metric: 'cpuScore',
      value: score.cpuScore,
    })
  }

  // ── Disk checks ───────────────────────────────────────────────────────────

  const fioReadIops = get('fio_read_iops')
  const fioWriteIops = get('fio_write_iops')
  const ddWrite = get('dd_write_mbps')
  const ddRead = get('dd_read_mbps')
  const fioRead = get('fio_read_mbps')
  const fioWrite = get('fio_write_mbps')

  if (fioWriteIops && fioWriteIops < 100) {
    issues.push({
      type: 'disk_throttling',
      severity: 'high',
      title: 'Disk Throttling Detected',
      description: `Write IOPS (${fioWriteIops}) is critically low. This is a common sign of oversold shared storage or disk throttling.`,
      metric: 'fio_write_iops',
      value: fioWriteIops,
    })
  }

  if (ddWrite && ddRead && ddWrite < ddRead * 0.3) {
    issues.push({
      type: 'disk_write_slow',
      severity: 'medium',
      title: 'Asymmetric Disk Write Speed',
      description: `Write speed (${ddWrite} MB/s) is significantly slower than read (${ddRead} MB/s). Possible write caching or thin provisioning issue.`,
      metric: 'dd_write_mbps',
      value: ddWrite,
    })
  }

  if (fioRead && fioWrite && fioRead > 1000 && fioWrite < 50) {
    issues.push({
      type: 'disk_fake_cache',
      severity: 'medium',
      title: 'Possible Fake Disk Cache',
      description: `Extremely high read (${fioRead} MB/s) but low write speed (${fioWrite} MB/s) suggests read cache inflation.`,
    })
  }

  // ── RAM checks ────────────────────────────────────────────────────────────

  if (benchmark.swapTotalMb && benchmark.swapTotalMb > 0 && benchmark.ramTotalMb && benchmark.ramTotalMb < 512) {
    issues.push({
      type: 'ram_insufficient',
      severity: 'medium',
      title: 'Low RAM — Swap Active',
      description: `Only ${benchmark.ramTotalMb}MB RAM with ${benchmark.swapTotalMb}MB swap. Workloads will use swap, degrading performance.`,
      metric: 'ramTotalMb',
      value: benchmark.ramTotalMb,
    })
  }

  const memRead = get('Read Speed')
  if (memRead && memRead < 1000) {
    issues.push({
      type: 'memory_slow',
      severity: 'low',
      title: 'Slow Memory Bandwidth',
      description: `Memory read speed (${memRead} MB/s) is below 1 GB/s. This may limit CPU-bound workloads.`,
      metric: 'Read Speed',
      value: memRead,
    })
  }

  // ── Network checks ────────────────────────────────────────────────────────

  if (benchmark.locations.length > 0) {
    const avgPing = benchmark.locations
      .filter(l => l.pingMs != null)
      .reduce((sum, l) => sum + (l.pingMs ?? 0), 0) / benchmark.locations.filter(l => l.pingMs != null).length

    if (avgPing > 150) {
      issues.push({
        type: 'high_latency',
        severity: 'low',
        title: 'High Network Latency',
        description: `Average ping across all test locations is ${avgPing.toFixed(0)}ms. Consider a closer data center for latency-sensitive workloads.`,
        metric: 'avgPingMs',
        value: avgPing,
      })
    }

    const lowBandwidth = benchmark.locations.filter(l => l.downloadMbps && l.downloadMbps < 10)
    if (lowBandwidth.length > 0) {
      issues.push({
        type: 'low_bandwidth',
        severity: 'medium',
        title: 'Low Network Bandwidth',
        description: `${lowBandwidth.length} location(s) show download below 10 Mbps: ${lowBandwidth.map(l => l.testLocation).join(', ')}.`,
      })
    }
  }

  // ── Load average check ────────────────────────────────────────────────────

  if (benchmark.loadAverage && benchmark.cpuCores) {
    const load1 = parseFloat(benchmark.loadAverage.split(',')[0]?.trim() ?? '0')
    if (load1 > benchmark.cpuCores * 2) {
      issues.push({
        type: 'high_load_avg',
        severity: 'medium',
        title: 'High Load Average at Benchmark Time',
        description: `Load average (${load1.toFixed(2)}) was more than 2× the CPU count (${benchmark.cpuCores}). Results may not reflect peak capacity.`,
        metric: 'loadAverage',
        value: load1,
      })
    }
  }

  if (issues.length > 0) {
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: { detectedIssues: issues as unknown as Prisma.InputJsonArray },
    })
    console.log(`[IssueDetection] ${benchmarkId}: ${issues.length} issue(s) found`)
  } else {
    console.log(`[IssueDetection] ${benchmarkId}: no issues detected`)
  }

  return issues
}
