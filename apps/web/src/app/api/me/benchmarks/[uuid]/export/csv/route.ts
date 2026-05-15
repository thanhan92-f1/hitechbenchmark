import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError } from '@/lib/utils'

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(c => {
    if (c == null) return ''
    const s = String(c)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }).join(',')
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const session = await auth()
  if (!session?.user) return apiError('Unauthorized', 401)

  const { uuid } = await params

  const benchmark = await db.benchmark.findUnique({
    where: { uuid },
    include: {
      scores: true,
      results: { orderBy: [{ category: 'asc' }, { metricName: 'asc' }] },
      locations: { orderBy: { testLocation: 'asc' } },
      provider: { select: { name: true } },
      country: { select: { name: true } },
    },
  })

  if (!benchmark) return apiError('Benchmark not found', 404)
  if (benchmark.userId !== session.user.id) return apiError('Forbidden', 403)

  const rows: string[] = []

  // System info section
  rows.push('# System Information')
  rows.push(csvRow(['Field', 'Value']))
  rows.push(csvRow(['UUID', benchmark.uuid]))
  rows.push(csvRow(['Hostname', benchmark.hostname]))
  rows.push(csvRow(['IPv4', benchmark.ipv4]))
  rows.push(csvRow(['OS', `${benchmark.osName ?? ''} ${benchmark.osVersion ?? ''}`.trim()]))
  rows.push(csvRow(['Kernel', benchmark.kernel]))
  rows.push(csvRow(['Architecture', benchmark.architecture]))
  rows.push(csvRow(['Virtualization', benchmark.virtualization]))
  rows.push(csvRow(['CPU', benchmark.cpuModel]))
  rows.push(csvRow(['CPU Cores', benchmark.cpuCores]))
  rows.push(csvRow(['RAM (MB)', benchmark.ramTotalMb]))
  rows.push(csvRow(['Disk (GB)', benchmark.diskTotalGb]))
  rows.push(csvRow(['Provider', benchmark.provider?.name]))
  rows.push(csvRow(['Country', benchmark.country?.name]))
  rows.push(csvRow(['Submitted', benchmark.createdAt.toISOString()]))
  rows.push('')

  // Scores section
  const score = benchmark.scores[0]
  if (score) {
    rows.push('# Benchmark Scores')
    rows.push(csvRow(['Category', 'Score', 'Confidence', 'Stability Bonus', 'Region Percentile']))
    rows.push(csvRow(['Total', score.totalScore, score.confidenceLevel, score.stabilityBonus, score.regionPercentile]))
    rows.push(csvRow(['CPU', score.cpuScore]))
    rows.push(csvRow(['Disk', score.diskScore]))
    rows.push(csvRow(['Memory', score.memoryScore]))
    rows.push(csvRow(['Network', score.networkScore]))
    rows.push(csvRow(['Security', score.securityScore]))
    rows.push('')
  }

  // Benchmark results
  rows.push('# Benchmark Results')
  rows.push(csvRow(['Category', 'Metric', 'Value', 'Unit']))
  for (const r of benchmark.results) {
    rows.push(csvRow([r.category, r.metricName, r.metricValue, r.unit]))
  }
  rows.push('')

  // Network tests
  if (benchmark.locations.length > 0) {
    rows.push('# Network Speed Tests')
    rows.push(csvRow(['Location', 'Download (Mbps)', 'Upload (Mbps)', 'Ping (ms)', 'Jitter (ms)']))
    for (const l of benchmark.locations) {
      rows.push(csvRow([l.testLocation, l.downloadMbps, l.uploadMbps, l.pingMs, l.jitterMs]))
    }
  }

  const body = rows.join('\n')
  const filename = `benchmark-${uuid.slice(0, 8)}.csv`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
