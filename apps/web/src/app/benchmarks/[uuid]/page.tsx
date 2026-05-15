import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  formatRAM, formatDisk, formatUptime, formatMbps, formatMs,
  formatScore, formatDate, getScoreColor, cn
} from '@/lib/utils'
import type { Metadata } from 'next'
import { Cpu, HardDrive, MemoryStick, Globe, Shield, Server, Brain, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { ShareCopy } from '@/components/benchmark/ShareCopy'
import { ExportDropdown } from '@/components/benchmark/ExportButton'
import { NetworkSpeedChart } from '@/components/charts/NetworkSpeedChart'
import { ScoreRadarChart } from '@/components/charts/ScoreRadarChart'
import { NetworkAnalysis } from '@/components/benchmark/NetworkAnalysis'
import { SecurityAudit } from '@/components/benchmark/SecurityAudit'
import { UseCaseBadges } from '@/components/benchmark/UseCaseBadges'
import { LatencyMap } from '@/components/benchmark/LatencyMap'
import { IpReputation } from '@/components/benchmark/IpReputation'
import type { AiAnalysis, PerformanceIssue } from '@/lib/ai-analysis'
import { TIER_META, ISSUE_SEVERITY_META } from '@/lib/ai-analysis'
import Link from 'next/link'

async function getBenchmark(uuid: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/benchmarks/${uuid}`, {
      next: { revalidate: 300 },
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string }>
}): Promise<Metadata> {
  const { uuid } = await params
  const b = await getBenchmark(uuid)
  if (!b) return { title: 'Benchmark Not Found' }

  return {
    title: `${b.hostname || b.ipv4} — Benchmark Result`,
    description: `${b.cpuModel} · ${formatRAM(b.ramTotalMb)} RAM · ${b.virtualization?.toUpperCase()} · Score: ${formatScore(b.scores?.[0]?.totalScore)}`,
    openGraph: {
      title: `${b.hostname || b.ipv4} Benchmark Result | HiTech Benchmark`,
      description: `CPU: ${b.cpuModel} · RAM: ${formatRAM(b.ramTotalMb)} · Score: ${formatScore(b.scores?.[0]?.totalScore)}`,
    },
  }
}

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score == null) return null
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={cn('font-mono font-semibold', getScoreColor(score))}>{formatScore(score)}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', {
            'bg-green-500': score >= 80,
            'bg-blue-500': score >= 60 && score < 80,
            'bg-yellow-500': score >= 40 && score < 60,
            'bg-red-500': score < 40,
          })}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default async function BenchmarkDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>
}) {
  const { uuid } = await params
  const b = await getBenchmark(uuid)

  if (!b) notFound()

  const scores = b.scores?.[0]
  const totalScore = scores?.totalScore

  // Group results by category
  const resultsByCategory: Record<string, typeof b.results> = {}
  for (const r of b.results || []) {
    if (!resultsByCategory[r.category]) resultsByCategory[r.category] = []
    resultsByCategory[r.category].push(r)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const aiAnalysis = b.aiAnalysis as AiAnalysis | null
  const detectedIssues = (b.detectedIssues as PerformanceIssue[] | null) ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {b.hostname || b.ipv4 || 'Benchmark Result'}
            </h1>
            <Badge variant="success">public</Badge>
            {b.virtualization && <Badge variant="outline">{b.virtualization.toUpperCase()}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {b.country && <span>{b.country.flagEmoji} {b.city ? `${b.city}, ` : ''}{b.country.name}</span>}
            {b.provider && <span>@ {b.provider.name}</span>}
            <span>{formatDate(b.createdAt)}</span>
          </div>
        </div>

        {/* Total Score */}
        <div className="flex flex-col items-center">
          {totalScore != null ? (
            <div className={cn('text-5xl font-bold font-mono', getScoreColor(totalScore))}>
              {formatScore(totalScore)}
            </div>
          ) : (
            <div className="text-4xl font-bold text-gray-300 dark:text-gray-700">—</div>
          )}
          <div className="text-sm text-gray-400 mt-1">Total Score</div>
          <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
            {scores?.confidenceLevel && (
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', {
                'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800': scores.confidenceLevel === 'high',
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800': scores.confidenceLevel === 'medium',
                'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700': scores.confidenceLevel === 'low',
              })}>
                {scores.confidenceLevel === 'high' ? '● High' : scores.confidenceLevel === 'medium' ? '◑ Medium' : '○ Low'} confidence
              </span>
            )}
            {scores?.regionPercentile != null && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                Top {100 - scores.regionPercentile}% in region
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <ShareCopy url={`${siteUrl}/benchmarks/${uuid}`} />
            <ExportDropdown uuid={uuid} />
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {scores && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 dark:text-white">Performance Score</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <ScoreBar score={scores.cpuScore} label="CPU (30%)" />
              <ScoreBar score={scores.diskScore} label="Disk (25%)" />
              <ScoreBar score={scores.networkScore} label="Network (25%)" />
              <ScoreBar score={scores.memoryScore} label="Memory (15%)" />
              <ScoreBar score={scores.securityScore} label="Security (5%)" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 dark:text-white">Score Radar</h2>
            </CardHeader>
            <CardBody className="p-0">
              <ScoreRadarChart
                data={[{
                  name: b.hostname || b.ipv4 || 'Benchmark',
                  cpu: scores.cpuScore ?? undefined,
                  disk: scores.diskScore ?? undefined,
                  memory: scores.memoryScore ?? undefined,
                  network: scores.networkScore ?? undefined,
                  security: scores.securityScore ?? undefined,
                }]}
              />
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">System Information</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {[
              ['Hostname', b.hostname],
              ['OS', b.osName && b.osVersion ? `${b.osName} ${b.osVersion}` : b.osName],
              ['Kernel', b.kernel],
              ['Architecture', b.architecture],
              ['Virtualization', b.virtualization?.toUpperCase()],
              ['CPU', b.cpuModel],
              ['CPU Cores / Threads', b.cpuCores && b.cpuThreads ? `${b.cpuCores}c / ${b.cpuThreads}t` : b.cpuCores],
              ['CPU Frequency', b.cpuFrequencyMhz ? `${b.cpuFrequencyMhz} MHz` : null],
              ['RAM', formatRAM(b.ramTotalMb)],
              ['Swap', formatRAM(b.swapTotalMb)],
              ['Disk', formatDisk(b.diskTotalGb)],
              ['Uptime', formatUptime(b.uptimeSeconds)],
              ['Load Average', b.loadAverage],
            ].map(([label, value]) =>
              value ? (
                <div key={label as string} className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
                  <span className="text-gray-900 dark:text-white font-mono text-right">{value as string}</span>
                </div>
              ) : null,
            )}
          </CardBody>
        </Card>

        {/* Network Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Network Information</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {[
              ['IPv4', b.ipv4],
              ['IPv6', b.ipv6],
              ['ASN', b.asn ? `AS${b.asn.asnNumber} — ${b.asn.name}` : null],
              ['ISP', b.isp],
              ['Organization', b.organization],
              ['Reverse DNS', b.reverseDns],
              ['Location', [b.city, b.region, b.country?.name].filter(Boolean).join(', ')],
            ].map(([label, value]) =>
              value ? (
                <div key={label as string} className="flex justify-between text-sm gap-2">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
                  <span className="text-gray-900 dark:text-white font-mono text-right break-all">{value as string}</span>
                </div>
              ) : null,
            )}
          </CardBody>
        </Card>
      </div>

      {/* IP Reputation */}
      {b.ipv4 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">IP Reputation</h2>
              <span className="ml-auto text-xs text-gray-400">{b.ipv4}</span>
            </div>
          </CardHeader>
          <CardBody>
            <IpReputation ip={b.ipv4} />
          </CardBody>
        </Card>
      )}

      {/* Disk Benchmarks */}
      {resultsByCategory.disk?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-yellow-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Disk Benchmark</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {resultsByCategory.disk.map((r: { metricName: string; metricValue: number; unit?: string }) => (
                <div key={r.metricName} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{r.metricName}</div>
                  <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                    {r.metricValue.toLocaleString()}
                    {r.unit && <span className="text-xs font-normal text-gray-400 ml-1">{r.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* CPU Benchmarks */}
      {resultsByCategory.cpu?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">CPU Benchmark</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {resultsByCategory.cpu.map((r: { metricName: string; metricValue: number; unit?: string }) => (
                <div key={r.metricName} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{r.metricName}</div>
                  <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                    {r.metricValue.toLocaleString()}
                    {r.unit && <span className="text-xs font-normal text-gray-400 ml-1">{r.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Memory Benchmarks */}
      {resultsByCategory.memory?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MemoryStick className="w-4 h-4 text-purple-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Memory Benchmark</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {resultsByCategory.memory.map((r: { metricName: string; metricValue: number; unit?: string }) => (
                <div key={r.metricName} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{r.metricName}</div>
                  <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                    {r.metricValue.toLocaleString()}
                    {r.unit && <span className="text-xs font-normal text-gray-400 ml-1">{r.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Network Speed Tests */}
      {b.locations?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Network Speed Tests</h2>
            </div>
          </CardHeader>
          <CardBody>
            <NetworkSpeedChart locations={b.locations} className="mb-4" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium text-right">Download</th>
                    <th className="pb-2 font-medium text-right">Upload</th>
                    <th className="pb-2 font-medium text-right">Ping</th>
                    <th className="pb-2 font-medium text-right">Jitter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {b.locations.map((loc: { testLocation: string; downloadMbps?: number; uploadMbps?: number; pingMs?: number; jitterMs?: number }) => (
                    <tr key={loc.testLocation}>
                      <td className="py-2.5 font-medium text-gray-900 dark:text-white">{loc.testLocation}</td>
                      <td className="py-2.5 text-right font-mono text-green-600 dark:text-green-400">
                        {formatMbps(loc.downloadMbps)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-blue-600 dark:text-blue-400">
                        {formatMbps(loc.uploadMbps)}
                      </td>
                      <td className="py-2.5 text-right font-mono">{formatMs(loc.pingMs)}</td>
                      <td className="py-2.5 text-right font-mono text-gray-400">{formatMs(loc.jitterMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Global Latency Map */}
      {b.locations?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Global Latency Map</h2>
            </div>
          </CardHeader>
          <CardBody>
            <LatencyMap locations={b.locations} />
          </CardBody>
        </Card>
      )}

      {/* Internet Quality Score — Use-case badges */}
      {b.locations?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Internet Quality Score</h2>
            </div>
          </CardHeader>
          <CardBody>
            <UseCaseBadges locations={b.locations} />
          </CardBody>
        </Card>
      )}

      {/* Network Quality Analysis */}
      {b.locations?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Network Quality Analysis</h2>
            </div>
          </CardHeader>
          <CardBody>
            <NetworkAnalysis uuid={uuid} />
          </CardBody>
        </Card>
      )}

      {/* Security Audit */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Security Audit</h2>
          </div>
        </CardHeader>
        <CardBody>
          <SecurityAudit
            securityData={b.rawPayload?.security}
            openPorts={b.rawPayload?.open_ports}
          />
        </CardBody>
      </Card>

      {/* Detected Performance Issues */}
      {detectedIssues.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Detected Issues</h2>
              <span className="ml-auto text-xs text-gray-400">{detectedIssues.length} issue{detectedIssues.length > 1 ? 's' : ''}</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {detectedIssues.map((issue, i) => {
              const meta = ISSUE_SEVERITY_META[issue.severity]
              return (
                <div key={i} className={cn('p-3 rounded-lg border', meta.bg,
                  issue.severity === 'high' ? 'border-red-200 dark:border-red-800' :
                  issue.severity === 'medium' ? 'border-yellow-200 dark:border-yellow-800' :
                  'border-blue-200 dark:border-blue-800'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-semibold uppercase tracking-wide', meta.color)}>
                      {meta.label}
                    </span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{issue.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}

      {/* AI Performance Analysis */}
      {aiAnalysis ? (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">AI Performance Analysis</h2>
              <span className="ml-auto text-xs text-gray-400">Powered by Claude</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-5">
            {/* Tier badge + summary */}
            {(() => {
              const tier = TIER_META[aiAnalysis.tier]
              return (
                <div className={cn('flex items-start gap-4 p-4 rounded-xl border', tier.bg, tier.border)}>
                  <div className="text-3xl">{tier.emoji}</div>
                  <div>
                    <div className={cn('text-lg font-bold mb-1', tier.color)}>{tier.label} Performance</div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
                  </div>
                </div>
              )
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sub-system analysis */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Component Analysis</h3>
                {[
                  { icon: Cpu, label: 'CPU', text: aiAnalysis.cpuAnalysis },
                  { icon: HardDrive, label: 'Disk', text: aiAnalysis.diskAnalysis },
                  { icon: Globe, label: 'Network', text: aiAnalysis.networkAnalysis },
                  { icon: MemoryStick, label: 'Memory', text: aiAnalysis.memoryAnalysis },
                ].map(({ icon: Icon, label, text }) => text && (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}: </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">{text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suitable workloads */}
              {aiAnalysis.suitableWorkloads?.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Suitable Workloads</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis.suitableWorkloads.map((w) => (
                      <span key={w} className="px-2 py-0.5 text-xs rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottlenecks */}
            {aiAnalysis.bottlenecks?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bottlenecks</h3>
                <ul className="space-y-1.5">
                  {aiAnalysis.bottlenecks.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {aiAnalysis.recommendations?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recommendations</h3>
                <ul className="space-y-1.5">
                  {aiAnalysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="mt-6 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
          <Brain className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">AI analysis is being generated…</p>
        </div>
      )}

      {/* Verify link */}
      <div className="mt-6 flex justify-center">
        <Link
          href={`/verify/${b.uuid}`}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          View Verification Certificate
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
