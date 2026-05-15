import { PrismaClient } from '@hitechbenchmark/db'
import { aiComplete } from '../lib/ai-client'

const prisma = new PrismaClient()

const SYSTEM_PROMPT = `You are an expert VPS/cloud server performance analyst for HiTech Benchmark.
Analyze benchmark results and provide a structured JSON assessment.

Tier classification:
- "weak": totalScore < 40 — basic tasks only
- "average": totalScore 40-69 — suitable for small-medium workloads
- "strong": totalScore 70-89 — suitable for demanding production workloads
- "enterprise": totalScore >= 90 — top-tier, suitable for any workload

Respond with valid JSON only. No markdown. No explanation outside JSON.`

export interface AiAnalysis {
  tier: 'weak' | 'average' | 'strong' | 'enterprise'
  summary: string
  bottlenecks: string[]
  suitableWorkloads: string[]
  recommendations: string[]
  cpuAnalysis: string
  diskAnalysis: string
  networkAnalysis: string
  memoryAnalysis: string
}

export async function analyzeWithAI({ benchmarkId }: { benchmarkId: string }) {
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    include: {
      results: true,
      scores: { orderBy: { createdAt: 'desc' }, take: 1 },
      locations: true,
      provider: { select: { name: true } },
      country: { select: { name: true } },
    },
  })

  if (!benchmark || !benchmark.scores[0]) {
    console.log(`[AIAnalysis] Benchmark ${benchmarkId} not ready`)
    return
  }

  const score = benchmark.scores[0]
  const netSummary = benchmark.locations.length > 0
    ? benchmark.locations
        .map(l => `${l.testLocation}: ${l.downloadMbps?.toFixed(0) ?? '?'}↓/${l.uploadMbps?.toFixed(0) ?? '?'}↑ ${l.pingMs?.toFixed(0) ?? '?'}ms`)
        .join(', ')
    : 'no network tests'

  const metricsSummary = benchmark.results
    .slice(0, 20)
    .map(r => `${r.metricName}=${r.metricValue}${r.unit ?? ''}`)
    .join(' ')

  const userContent = `Benchmark data:
Server: ${benchmark.cpuModel} ${benchmark.cpuCores}c/${benchmark.cpuThreads}t, ${benchmark.ramTotalMb}MB RAM, ${benchmark.diskTotalGb}GB
OS: ${benchmark.osName} ${benchmark.osVersion} | Virt: ${benchmark.virtualization}
Provider: ${benchmark.provider?.name ?? 'unknown'} | Country: ${benchmark.country?.name ?? 'unknown'}
Scores: CPU=${score.cpuScore} Disk=${score.diskScore} Net=${score.networkScore} Mem=${score.memoryScore} Sec=${score.securityScore} Total=${score.totalScore}
Network: ${netSummary}
Metrics: ${metricsSummary || 'none'}

Respond with JSON matching this schema exactly:
{"tier":"weak|average|strong|enterprise","summary":"2-3 sentences","bottlenecks":["..."],"suitableWorkloads":["..."],"recommendations":["..."],"cpuAnalysis":"1 sentence","diskAnalysis":"1 sentence","networkAnalysis":"1 sentence","memoryAnalysis":"1 sentence"}`

  try {
    const text = await aiComplete(SYSTEM_PROMPT, userContent)
    if (!text) {
      console.log(`[AIAnalysis] Skipped for ${benchmarkId} (provider disabled or no key)`)
      return
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const analysis = JSON.parse(jsonMatch[0]) as AiAnalysis

    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        aiAnalysis: analysis as unknown as Record<string, unknown>,
        aiAnalyzedAt: new Date(),
      },
    })

    console.log(`[AIAnalysis] ${benchmarkId} → tier: ${analysis.tier} (score: ${score.totalScore})`)
    return analysis
  } catch (err) {
    console.error(`[AIAnalysis] Failed for ${benchmarkId}:`, err)
    throw err
  }
}
