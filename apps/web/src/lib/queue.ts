import { Queue } from 'bullmq'
import { redis } from './redis'

// Queue names as constants to avoid typos
export const QUEUE_NAMES = {
  BENCHMARK: 'benchmark',
} as const

// Job names
export const JOB_NAMES = {
  PROCESS_PAYLOAD: 'ProcessBenchmarkPayload',
  DETECT_PROVIDER: 'DetectProvider',
  ENRICH_GEO_IP: 'EnrichGeoIp',
  CALCULATE_SCORE: 'CalculateBenchmarkScore',
  DETECT_FAKE: 'DetectFakeBenchmark',
  GENERATE_EXPORT: 'GenerateBenchmarkExport',
  REFRESH_STATS_CACHE: 'RefreshStatisticsCache',
} as const

const connection = redis

export const benchmarkQueue = new Queue(QUEUE_NAMES.BENCHMARK, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { age: 86400 }, // 24h
    removeOnFail: { age: 604800 }, // 7 days
  },
})

export async function enqueueBenchmarkProcessing(benchmarkId: string) {
  await benchmarkQueue.add(
    JOB_NAMES.PROCESS_PAYLOAD,
    { benchmarkId },
    { priority: 1 },
  )
}
