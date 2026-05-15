import { SCORING_WEIGHTS, SCORE_VERSION, SCORE_MAX } from '@hitechbenchmark/shared'
import type { BenchmarkPayload } from '@hitechbenchmark/shared'

// Reference values for normalization (based on mid-range VPS performance)
const CPU_REFERENCE = {
  eventsPerSecond: 2000, // sysbench single-thread reference
  multiEventsFactor: 8,  // expected multi/single ratio for 8-core
}

const DISK_REFERENCE = {
  readIops: 50_000,
  writeIops: 30_000,
  readMbps: 500,
  writeMbps: 300,
}

const MEMORY_REFERENCE = {
  readMbps: 10_000,
  writeMbps: 8_000,
}

const NETWORK_REFERENCE = {
  downloadMbps: 500,
  uploadMbps: 500,
}

function normalize(value: number, reference: number, max = SCORE_MAX): number {
  return Math.min((value / reference) * max, max)
}

export interface BenchmarkScoreResult {
  cpuScore: number
  diskScore: number
  memoryScore: number
  networkScore: number
  securityScore: number
  totalScore: number
  scoreVersion: string
}

export function calculateScore(payload: BenchmarkPayload): BenchmarkScoreResult {
  // CPU Score
  let cpuScore = 0
  if (payload.cpu_results.events_per_second) {
    const single = normalize(payload.cpu_results.events_per_second, CPU_REFERENCE.eventsPerSecond)
    const multi = payload.cpu_results.sysbench_multi_score
      ? normalize(
          payload.cpu_results.sysbench_multi_score,
          CPU_REFERENCE.eventsPerSecond * CPU_REFERENCE.multiEventsFactor,
        )
      : single * (payload.system.cpu_cores || 1) * 0.7
    cpuScore = (single * 0.4 + multi * 0.6)
  }

  // Disk Score
  let diskScore = 0
  if (payload.disk_results.length > 0) {
    const disk = payload.disk_results[0]
    const iopsScore =
      ((normalize(disk.fio_read_iops || 0, DISK_REFERENCE.readIops) +
        normalize(disk.fio_write_iops || 0, DISK_REFERENCE.writeIops)) /
        2)
    const throughputScore =
      ((normalize(disk.fio_read_mbps || disk.dd_read_mbps || 0, DISK_REFERENCE.readMbps) +
        normalize(disk.fio_write_mbps || disk.dd_write_mbps || 0, DISK_REFERENCE.writeMbps)) /
        2)
    diskScore = iopsScore * 0.6 + throughputScore * 0.4
  }

  // Memory Score
  let memoryScore = 0
  if (payload.memory_results.read_speed_mbps) {
    memoryScore =
      (normalize(payload.memory_results.read_speed_mbps, MEMORY_REFERENCE.readMbps) * 0.5 +
        normalize(payload.memory_results.write_speed_mbps || 0, MEMORY_REFERENCE.writeMbps) * 0.5)
  }

  // Network Score
  let networkScore = 0
  if (payload.network_results.length > 0) {
    const scores = payload.network_results
      .filter((r) => r.download_mbps)
      .map((r) => {
        const dl = normalize(r.download_mbps || 0, NETWORK_REFERENCE.downloadMbps)
        const ul = normalize(r.upload_mbps || 0, NETWORK_REFERENCE.uploadMbps)
        return dl * 0.6 + ul * 0.4
      })
    networkScore = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1)
  }

  // Security Score (binary checks)
  let securityScore = 50 // baseline
  const sec = payload.security
  if (sec.firewall_detected) securityScore += 20
  if (sec.selinux || sec.apparmor) securityScore += 15
  if (sec.kernel_hardening && Object.values(sec.kernel_hardening).some(Boolean)) securityScore += 15
  securityScore = Math.min(securityScore, SCORE_MAX)

  // Total weighted score
  const totalScore =
    cpuScore * SCORING_WEIGHTS.cpu +
    diskScore * SCORING_WEIGHTS.disk +
    networkScore * SCORING_WEIGHTS.network +
    memoryScore * SCORING_WEIGHTS.memory +
    securityScore * SCORING_WEIGHTS.security

  return {
    cpuScore: Math.round(cpuScore * 10) / 10,
    diskScore: Math.round(diskScore * 10) / 10,
    memoryScore: Math.round(memoryScore * 10) / 10,
    networkScore: Math.round(networkScore * 10) / 10,
    securityScore: Math.round(securityScore * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
    scoreVersion: SCORE_VERSION,
  }
}
