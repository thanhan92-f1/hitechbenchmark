import { PrismaClient } from '@hitechbenchmark/db'

const prisma = new PrismaClient()

export async function detectFakeBenchmark({ benchmarkId }: { benchmarkId: string }) {
  // Fake detection is primarily done at ingest time via anti-fake.ts
  // This job handles post-processing checks that require database context
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    include: {
      results: true,
      locations: true,
      flags: true,
    },
  })

  if (!benchmark) return

  const newFlags: { reason: string; severity: 'low' | 'medium' | 'high'; detail: string }[] = []

  // Check if same IP submitted too many benchmarks recently
  if (benchmark.submitterIp) {
    const recentCount = await prisma.benchmark.count({
      where: {
        submitterIp: benchmark.submitterIp,
        createdAt: { gte: new Date(Date.now() - 3600 * 1000) }, // last hour
        id: { not: benchmarkId },
      },
    })

    if (recentCount > 5) {
      newFlags.push({
        reason: 'high_submission_rate',
        severity: 'medium',
        detail: `IP ${benchmark.submitterIp} submitted ${recentCount} benchmarks in the last hour`,
      })
    }
  }

  // Check for suspiciously perfect network scores (all 0ms ping, perfect speeds)
  const allPerfectNetwork = benchmark.locations.every(
    (l) => l.pingMs === 0 || l.downloadMbps === l.uploadMbps,
  )
  if (allPerfectNetwork && benchmark.locations.length > 2) {
    newFlags.push({
      reason: 'network_results_suspicious',
      severity: 'low',
      detail: 'Network test results appear artificially perfect',
    })
  }

  if (newFlags.length > 0) {
    await prisma.abuseFlag.createMany({
      data: newFlags.map((f) => ({
        benchmarkId,
        reason: f.reason,
        severity: f.severity,
        status: 'pending',
        metadata: { detail: f.detail },
      })),
    })

    // Lower trust score further
    const trustPenalty = newFlags.filter((f) => f.severity === 'high').length * 0.3 +
      newFlags.filter((f) => f.severity === 'medium').length * 0.1

    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        trustScore: { decrement: trustPenalty },
        ...(benchmark.flags.length + newFlags.length > 2 && { status: 'flagged' }),
      },
    })
  }

  console.log(`[DetectFake] Benchmark ${benchmarkId}: ${newFlags.length} additional flags found`)
}
