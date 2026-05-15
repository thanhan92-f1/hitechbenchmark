import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  formatRAM, formatDisk, formatUptime, formatMbps, formatMs,
  formatScore, formatDate, getScoreColor, cn
} from '@/lib/utils'
import type { Metadata } from 'next'
import { Cpu, HardDrive, MemoryStick, Globe, Shield, Server, Share2 } from 'lucide-react'
import { ShareCopy } from '@/components/benchmark/ShareCopy'

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
          <ShareCopy url={`${siteUrl}/benchmarks/${uuid}`} className="mt-3" />
        </div>
      </div>

      {/* Score Breakdown */}
      {scores && (
        <Card className="mb-6">
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
    </div>
  )
}
