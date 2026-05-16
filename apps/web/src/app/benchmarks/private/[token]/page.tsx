import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ShareCopy } from '@/components/benchmark/ShareCopy'
import {
  formatRAM,
  formatDisk,
  formatUptime,
  formatMbps,
  formatMs,
  formatScore,
  formatDate,
  getScoreColor,
  cn,
} from '@/lib/utils'
import { Cpu, HardDrive, MemoryStick, Globe, Shield, Server, Lock, CheckCircle } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Private Benchmark Result',
    description: 'Private HiTech Benchmark result',
  }
}

async function getPrivateBenchmark(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex')

  return db.benchmark.findUnique({
    where: { privateTokenHash: tokenHash, deletedAt: null },
    include: {
      country: true,
      provider: { select: { id: true, name: true, slug: true, logoUrl: true, websiteUrl: true } },
      asn: { select: { asnNumber: true, name: true, organization: true } },
      results: true,
      scores: { orderBy: { createdAt: 'desc' }, take: 1 },
      locations: { orderBy: { pingMs: 'asc' } },
    },
  })
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null

  return (
    <div className="flex justify-between text-sm gap-2">
      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-900 dark:text-white font-mono text-right break-all">{value}</span>
    </div>
  )
}

export default async function PrivateBenchmarkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const b = await getPrivateBenchmark(token)

  if (!b) notFound()

  const scores = b.scores?.[0]
  const totalScore = scores?.totalScore
  const resultsByCategory: Record<string, typeof b.results> = {}
  for (const r of b.results || []) {
    if (!resultsByCategory[r.category]) resultsByCategory[r.category] = []
    resultsByCategory[r.category].push(r)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const privateUrl = `${siteUrl}/benchmarks/private/${token}`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {b.hostname || b.ipv4 || 'Private Benchmark Result'}
            </h1>
            <Badge variant="warning">private</Badge>
            {b.status && b.status !== 'completed' && <Badge variant="info">{b.status}</Badge>}
            {b.virtualization && <Badge variant="outline">{b.virtualization.toUpperCase()}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {b.country && <span>{b.country.flagEmoji} {b.city ? `${b.city}, ` : ''}{b.country.name}</span>}
            {b.provider && <span>@ {b.provider.name}</span>}
            <span>{formatDate(b.createdAt.toISOString())}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {totalScore != null ? (
            <div className={cn('text-5xl font-bold font-mono', getScoreColor(totalScore))}>
              {formatScore(totalScore)}
            </div>
          ) : (
            <div className="text-4xl font-bold text-gray-300 dark:text-gray-700">—</div>
          )}
          <div className="text-sm text-gray-400 mt-1">Total Score</div>
          <div className="mt-3"><ShareCopy url={privateUrl} /></div>
        </div>
      </div>

      <Card className="mb-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50/60 dark:bg-yellow-950/20">
        <CardBody className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h2 className="font-semibold text-yellow-900 dark:text-yellow-200">Private benchmark link</h2>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Keep this URL safe. Anyone with this private link can view this result.
            </p>
          </div>
        </CardBody>
      </Card>

      {b.status && b.status !== 'completed' && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20">
          <CardBody className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h2 className="font-semibold text-blue-900 dark:text-blue-200">Benchmark received</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Results are being processed. Refresh this page after the worker finishes to see scores.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">System Information</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            <InfoRow label="Hostname" value={b.hostname} />
            <InfoRow label="OS" value={b.osName && b.osVersion ? `${b.osName} ${b.osVersion}` : b.osName} />
            <InfoRow label="Kernel" value={b.kernel} />
            <InfoRow label="Architecture" value={b.architecture} />
            <InfoRow label="Virtualization" value={b.virtualization?.toUpperCase()} />
            <InfoRow label="CPU" value={b.cpuModel} />
            <InfoRow label="CPU Cores / Threads" value={b.cpuCores && b.cpuThreads ? `${b.cpuCores}c / ${b.cpuThreads}t` : b.cpuCores} />
            <InfoRow label="RAM" value={formatRAM(b.ramTotalMb)} />
            <InfoRow label="Swap" value={formatRAM(b.swapTotalMb)} />
            <InfoRow label="Disk" value={formatDisk(b.diskTotalGb)} />
            <InfoRow label="Uptime" value={formatUptime(b.uptimeSeconds)} />
            <InfoRow label="Load Average" value={b.loadAverage} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Network Information</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            <InfoRow label="IPv4" value={b.ipv4} />
            <InfoRow label="IPv6" value={b.ipv6} />
            <InfoRow label="ASN" value={b.asn ? `AS${b.asn.asnNumber} — ${b.asn.name}` : null} />
            <InfoRow label="ISP" value={b.isp} />
            <InfoRow label="Organization" value={b.organization} />
            <InfoRow label="Reverse DNS" value={b.reverseDns} />
            <InfoRow label="Location" value={[b.city, b.region, b.country?.name].filter(Boolean).join(', ')} />
          </CardBody>
        </Card>
      </div>

      {scores && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-white">Scores</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ['CPU', scores.cpuScore],
                ['Disk', scores.diskScore],
                ['Memory', scores.memoryScore],
                ['Network', scores.networkScore],
                ['Security', scores.securityScore],
                ['Total', scores.totalScore],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label as string}</div>
                  <div className={cn('text-lg font-mono font-bold', getScoreColor((value as number | null) ?? 0))}>
                    {formatScore(value as number | null)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {['disk', 'cpu', 'memory', 'security'].map(category => (
        resultsByCategory[category]?.length > 0 ? (
          <Card key={category} className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                {category === 'disk' && <HardDrive className="w-4 h-4 text-yellow-600" />}
                {category === 'cpu' && <Cpu className="w-4 h-4 text-blue-600" />}
                {category === 'memory' && <MemoryStick className="w-4 h-4 text-purple-600" />}
                {category === 'security' && <Shield className="w-4 h-4 text-red-600" />}
                <h2 className="font-semibold text-gray-900 dark:text-white capitalize">{category} Results</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {resultsByCategory[category].map((r) => (
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
        ) : null
      ))}

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
                  {b.locations.map((loc) => (
                    <tr key={loc.testLocation}>
                      <td className="py-2.5 font-medium text-gray-900 dark:text-white">{loc.testLocation}</td>
                      <td className="py-2.5 text-right font-mono text-green-600 dark:text-green-400">{formatMbps(loc.downloadMbps)}</td>
                      <td className="py-2.5 text-right font-mono text-blue-600 dark:text-blue-400">{formatMbps(loc.uploadMbps)}</td>
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

      {b.visibility === 'public' && (
        <div className="mt-8 text-center">
          <Link href={`/benchmarks/${b.uuid}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Open public benchmark page →
          </Link>
        </div>
      )}
    </div>
  )
}
