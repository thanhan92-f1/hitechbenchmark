import { Worker, Queue } from 'bullmq'
import Redis from 'ioredis'
import { processBenchmarkPayload } from './jobs/ProcessBenchmarkPayloadJob'
import { detectProvider } from './jobs/DetectProviderJob'
import { enrichGeoIp } from './jobs/EnrichGeoIpJob'
import { calculateBenchmarkScore } from './jobs/CalculateBenchmarkScoreJob'
import { detectFakeBenchmark } from './jobs/DetectFakeBenchmarkJob'
import { refreshStatisticsCache } from './jobs/RefreshStatisticsCacheJob'

const QUEUE_NAME = 'benchmark'
const JOB_NAMES = {
  PROCESS_PAYLOAD: 'ProcessBenchmarkPayload',
  DETECT_PROVIDER: 'DetectProvider',
  ENRICH_GEO_IP: 'EnrichGeoIp',
  CALCULATE_SCORE: 'CalculateBenchmarkScore',
  DETECT_FAKE: 'DetectFakeBenchmark',
  REFRESH_STATS_CACHE: 'RefreshStatisticsCache',
}

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name} (${job.id})`, job.data)

    switch (job.name) {
      case JOB_NAMES.PROCESS_PAYLOAD:
        return processBenchmarkPayload(job.data)
      case JOB_NAMES.DETECT_PROVIDER:
        return detectProvider(job.data)
      case JOB_NAMES.ENRICH_GEO_IP:
        return enrichGeoIp(job.data)
      case JOB_NAMES.CALCULATE_SCORE:
        return calculateBenchmarkScore(job.data)
      case JOB_NAMES.DETECT_FAKE:
        return detectFakeBenchmark(job.data)
      case JOB_NAMES.REFRESH_STATS_CACHE:
        return refreshStatisticsCache(job.data)
      default:
        console.warn(`[Worker] Unknown job: ${job.name}`)
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 50, duration: 1000 },
  },
)

worker.on('completed', (job) => {
  console.log(`[Worker] ✓ Job ${job.name} (${job.id}) completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] ✗ Job ${job?.name} (${job?.id}) failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('[Worker] Error:', err)
})

console.log(`[Worker] Started — listening on queue: ${QUEUE_NAME}`)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, closing gracefully...')
  await worker.close()
  await connection.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await worker.close()
  await connection.quit()
  process.exit(0)
})
