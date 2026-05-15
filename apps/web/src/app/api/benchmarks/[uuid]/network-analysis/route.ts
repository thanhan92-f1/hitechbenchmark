import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'

interface NetworkQuality {
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  avgDownloadMbps: number | null
  avgUploadMbps: number | null
  avgPingMs: number | null
  avgJitterMs: number | null
  bestLocation: string | null
  worstLocation: string | null
  consistency: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  asnInfo: {
    asNumber: number | null
    name: string | null
    organization: string | null
  }
}

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function normalize(val: number, ref: number) {
  return Math.min((val / ref) * 100, 100)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params

  const benchmark = await db.benchmark.findUnique({
    where: { uuid, visibility: 'public', deletedAt: null },
    include: {
      locations: { orderBy: { pingMs: 'asc' } },
      asn: { select: { asnNumber: true, name: true, organization: true } },
    },
  })

  if (!benchmark) return apiError('Benchmark not found', 404)

  const locs = benchmark.locations
  if (locs.length === 0) {
    return apiResponse<NetworkQuality>({
      overallScore: 0,
      grade: 'F',
      avgDownloadMbps: null,
      avgUploadMbps: null,
      avgPingMs: null,
      avgJitterMs: null,
      bestLocation: null,
      worstLocation: null,
      consistency: 0,
      summary: 'No network test data available.',
      strengths: [],
      weaknesses: ['No speedtest locations recorded'],
      asnInfo: { asNumber: null, name: null, organization: null },
    })
  }

  const withDown = locs.filter(l => l.downloadMbps != null)
  const withPing = locs.filter(l => l.pingMs != null)

  const avgDown = withDown.length > 0
    ? withDown.reduce((s, l) => s + (l.downloadMbps ?? 0), 0) / withDown.length
    : null
  const avgUp = withDown.length > 0
    ? withDown.reduce((s, l) => s + (l.uploadMbps ?? 0), 0) / withDown.length
    : null
  const avgPing = withPing.length > 0
    ? withPing.reduce((s, l) => s + (l.pingMs ?? 0), 0) / withPing.length
    : null
  const avgJitter = withPing.length > 0
    ? withPing.reduce((s, l) => s + (l.jitterMs ?? 0), 0) / withPing.length
    : null

  // Score components
  const downloadScore = avgDown != null ? normalize(avgDown, 500) : 0
  const uploadScore = avgUp != null ? normalize(avgUp, 500) : 0
  const pingScore = avgPing != null ? Math.max(0, 100 - (avgPing / 2)) : 0
  const jitterScore = avgJitter != null ? Math.max(0, 100 - (avgJitter * 5)) : 80

  // Consistency: coefficient of variation of download speeds (lower = better)
  let consistency = 100
  if (withDown.length > 1) {
    const mean = avgDown!
    const variance = withDown.reduce((s, l) => s + Math.pow((l.downloadMbps ?? 0) - mean, 2), 0) / withDown.length
    const cv = (Math.sqrt(variance) / mean) * 100
    consistency = Math.max(0, 100 - cv)
  }

  const overallScore = Math.round(
    downloadScore * 0.35 +
    uploadScore * 0.20 +
    pingScore * 0.25 +
    jitterScore * 0.10 +
    consistency * 0.10,
  )

  // Best/worst locations by download
  const sorted = [...withDown].sort((a, b) => (b.downloadMbps ?? 0) - (a.downloadMbps ?? 0))
  const bestLocation = sorted[0]?.testLocation ?? null
  const worstLocation = sorted[sorted.length - 1]?.testLocation ?? null

  // Strengths / weaknesses
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (avgDown != null && avgDown >= 200) strengths.push(`Fast download (avg ${avgDown.toFixed(0)} Mbps)`)
  if (avgDown != null && avgDown < 50) weaknesses.push(`Slow download (avg ${avgDown.toFixed(0)} Mbps)`)
  if (avgPing != null && avgPing <= 30) strengths.push(`Low latency (avg ${avgPing.toFixed(0)} ms)`)
  if (avgPing != null && avgPing > 100) weaknesses.push(`High latency (avg ${avgPing.toFixed(0)} ms)`)
  if (avgJitter != null && avgJitter < 5) strengths.push(`Stable connection (jitter ${avgJitter.toFixed(1)} ms)`)
  if (avgJitter != null && avgJitter > 20) weaknesses.push(`High jitter (${avgJitter.toFixed(1)} ms) — unstable routing`)
  if (consistency >= 85) strengths.push('Consistent speeds across all test locations')
  if (consistency < 60) weaknesses.push('Inconsistent speeds across locations — possible throttling')
  if (locs.length >= 5) strengths.push(`Tested from ${locs.length} global locations`)

  const grade = gradeFromScore(overallScore)

  const summaryParts = []
  if (avgDown != null) summaryParts.push(`${avgDown.toFixed(0)} Mbps download`)
  if (avgPing != null) summaryParts.push(`${avgPing.toFixed(0)} ms average ping`)
  if (locs.length) summaryParts.push(`${locs.length} test locations`)
  const summary = summaryParts.length > 0
    ? `Network grade ${grade}: ${summaryParts.join(', ')}.`
    : 'Network analysis complete.'

  return apiResponse<NetworkQuality>({
    overallScore,
    grade,
    avgDownloadMbps: avgDown != null ? Math.round(avgDown * 10) / 10 : null,
    avgUploadMbps: avgUp != null ? Math.round(avgUp * 10) / 10 : null,
    avgPingMs: avgPing != null ? Math.round(avgPing * 10) / 10 : null,
    avgJitterMs: avgJitter != null ? Math.round(avgJitter * 10) / 10 : null,
    bestLocation,
    worstLocation,
    consistency: Math.round(consistency),
    summary,
    strengths,
    weaknesses,
    asnInfo: {
      asNumber: benchmark.asn?.asnNumber ?? null,
      name: benchmark.asn?.name ?? null,
      organization: benchmark.asn?.organization ?? null,
    },
  })
}
