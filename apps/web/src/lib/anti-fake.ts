import { ANTI_FAKE_LIMITS } from '@hitechbenchmark/shared'
import type { BenchmarkPayload } from '@hitechbenchmark/shared'

export interface AntiFakeResult {
  passed: boolean
  flags: AntiFakeFlag[]
  trustScore: number
}

export interface AntiFakeFlag {
  rule: string
  severity: 'low' | 'medium' | 'high'
  detail: string
}

export function runAntiFakeChecks(
  payload: BenchmarkPayload,
  submitterIp: string,
): AntiFakeResult {
  const flags: AntiFakeFlag[] = []

  // 1. IP mismatch check
  const payloadIp = payload.network.ipv4
  if (payloadIp && submitterIp && !ipsMatch(payloadIp, submitterIp)) {
    flags.push({
      rule: 'ip_mismatch',
      severity: 'high',
      detail: `Submitter IP ${submitterIp} does not match payload IPv4 ${payloadIp}`,
    })
  }

  // 2. Network speed sanity
  for (const net of payload.network_results) {
    const maxMbps = ANTI_FAKE_LIMITS.maxNetworkGbps * 1000
    if ((net.download_mbps || 0) > maxMbps) {
      flags.push({
        rule: 'network_speed_unrealistic',
        severity: 'high',
        detail: `Download ${net.download_mbps} Mbps at ${net.location} exceeds ${ANTI_FAKE_LIMITS.maxNetworkGbps} Gbps limit`,
      })
    }
    if ((net.upload_mbps || 0) > maxMbps) {
      flags.push({
        rule: 'network_upload_unrealistic',
        severity: 'high',
        detail: `Upload ${net.upload_mbps} Mbps at ${net.location} exceeds limit`,
      })
    }
  }

  // 3. Disk IOPS sanity
  for (const disk of payload.disk_results) {
    if ((disk.fio_read_iops || 0) > ANTI_FAKE_LIMITS.maxIops) {
      flags.push({
        rule: 'disk_iops_unrealistic',
        severity: 'high',
        detail: `Read IOPS ${disk.fio_read_iops} exceeds maximum ${ANTI_FAKE_LIMITS.maxIops}`,
      })
    }
    if ((disk.fio_write_iops || 0) > ANTI_FAKE_LIMITS.maxIops) {
      flags.push({
        rule: 'disk_write_iops_unrealistic',
        severity: 'high',
        detail: `Write IOPS ${disk.fio_write_iops} exceeds maximum`,
      })
    }
    if ((disk.dd_write_mbps || 0) > ANTI_FAKE_LIMITS.maxDiskWriteMbps) {
      flags.push({
        rule: 'disk_write_speed_unrealistic',
        severity: 'medium',
        detail: `DD write ${disk.dd_write_mbps} MB/s exceeds ${ANTI_FAKE_LIMITS.maxDiskWriteMbps} MB/s limit`,
      })
    }
  }

  // 4. RAM sanity
  const ramGb = (payload.system.ram_total_mb || 0) / 1024
  if (ramGb > ANTI_FAKE_LIMITS.maxRamGb) {
    flags.push({
      rule: 'ram_unrealistic',
      severity: 'high',
      detail: `RAM ${ramGb} GB exceeds ${ANTI_FAKE_LIMITS.maxRamGb} GB limit`,
    })
  }

  // 5. CPU cores sanity
  if ((payload.system.cpu_cores || 0) > ANTI_FAKE_LIMITS.maxCpuCores) {
    flags.push({
      rule: 'cpu_cores_unrealistic',
      severity: 'medium',
      detail: `CPU cores ${payload.system.cpu_cores} exceeds ${ANTI_FAKE_LIMITS.maxCpuCores} limit`,
    })
  }

  // 6. CPU/memory correlation: high-core count with very low RAM is suspicious
  const coresPerGbRam = (payload.system.cpu_cores || 1) / Math.max(ramGb, 0.5)
  if (coresPerGbRam > 16) {
    flags.push({
      rule: 'cpu_ram_correlation_suspicious',
      severity: 'low',
      detail: `${payload.system.cpu_cores} cores with only ${ramGb.toFixed(1)} GB RAM is unusual`,
    })
  }

  // 7. Timestamp freshness
  const now = Math.floor(Date.now() / 1000)
  const delta = Math.abs(now - payload.timestamp)
  if (delta > ANTI_FAKE_LIMITS.maxTimestampDeltaSeconds) {
    flags.push({
      rule: 'timestamp_stale',
      severity: 'high',
      detail: `Payload timestamp is ${delta}s old, exceeds allowed drift`,
    })
  }

  // Calculate trust score (1.0 = fully trusted, 0.0 = completely untrusted)
  const highFlags = flags.filter((f) => f.severity === 'high').length
  const medFlags = flags.filter((f) => f.severity === 'medium').length
  const lowFlags = flags.filter((f) => f.severity === 'low').length

  let trustScore = 1.0
  trustScore -= highFlags * 0.4
  trustScore -= medFlags * 0.15
  trustScore -= lowFlags * 0.05
  trustScore = Math.max(0, trustScore)

  return {
    passed: highFlags === 0,
    flags,
    trustScore,
  }
}

function ipsMatch(a: string, b: string): boolean {
  // Handle IPv4-mapped IPv6 addresses
  const normalize = (ip: string) =>
    ip.replace(/^::ffff:/i, '').trim()
  return normalize(a) === normalize(b)
}
