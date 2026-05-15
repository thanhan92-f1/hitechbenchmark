import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatRAM, formatDisk, formatScore, formatDate, getScoreColor, cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Shield, CheckCircle, Cpu, HardDrive, Globe, Server } from 'lucide-react'
import type { AiAnalysis } from '@/lib/ai-analysis'
import { TIER_META } from '@/lib/ai-analysis'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ uuid: string }> }): Promise<Metadata> {
  const { uuid } = await params
  return {
    title: `Verification Certificate — ${uuid.slice(0, 8)}`,
    description: 'HiTech Benchmark verification certificate',
  }
}

async function getBenchmarkForVerify(uuid: string) {
  return db.benchmark.findUnique({
    where: { uuid, visibility: 'public', deletedAt: null },
    include: {
      country: true,
      provider: { select: { name: true, slug: true } },
      scores: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-mono text-gray-900 dark:text-white text-right ml-4 break-all">{value}</span>
    </div>
  )
}

export default async function VerifyPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const b = await getBenchmarkForVerify(uuid)
  if (!b) notFound()

  const scores = b.scores[0]
  const aiAnalysis = b.aiAnalysis as AiAnalysis | null
  const tier = aiAnalysis ? TIER_META[aiAnalysis.tier] : null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hitechbenchmark.com'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Certificate card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wider opacity-80">Benchmark Certificate</span>
                </div>
                <h1 className="text-2xl font-bold">{b.hostname || b.ipv4 || 'Server Benchmark'}</h1>
              </div>
              {scores?.totalScore != null && (
                <div className="text-right">
                  <div className="text-4xl font-bold font-mono">{formatScore(scores.totalScore)}</div>
                  <div className="text-sm opacity-70 mt-1">Total Score</div>
                </div>
              )}
            </div>
          </div>

          {/* AI Tier badge */}
          {tier && (
            <div className={cn('px-8 py-3 flex items-center gap-3 border-b', tier.bg, tier.border.replace('border', 'border-b'))}>
              <span className="text-2xl">{tier.emoji}</span>
              <span className={cn('font-semibold', tier.color)}>{tier.label} Performance Tier</span>
              {aiAnalysis?.summary && (
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{aiAnalysis.summary}</span>
              )}
            </div>
          )}

          <div className="px-8 py-6 space-y-6">
            {/* Verification status */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-300 text-sm">Verified by HiTech Benchmark</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Benchmark ID: <span className="font-mono">{b.uuid}</span>
                </p>
              </div>
            </div>

            {/* Score grid */}
            {scores && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" /> Performance Scores
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'CPU', value: scores.cpuScore },
                    { label: 'Disk', value: scores.diskScore },
                    { label: 'Network', value: scores.networkScore },
                    { label: 'Memory', value: scores.memoryScore },
                    { label: 'Security', value: scores.securityScore },
                    { label: 'Total', value: scores.totalScore },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
                      <div className={cn('text-lg font-bold font-mono', getScoreColor(value ?? 0))}>
                        {value != null ? formatScore(value) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System info */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> System Specifications
              </h2>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2">
                <Row label="CPU" value={b.cpuModel} />
                <Row label="CPU Cores / Threads" value={b.cpuCores && b.cpuThreads ? `${b.cpuCores} cores / ${b.cpuThreads} threads` : undefined} />
                <Row label="RAM" value={formatRAM(b.ramTotalMb)} />
                <Row label="Disk" value={formatDisk(b.diskTotalGb)} />
                <Row label="Virtualization" value={b.virtualization?.toUpperCase()} />
                <Row label="OS" value={b.osName && b.osVersion ? `${b.osName} ${b.osVersion}` : b.osName ?? undefined} />
              </div>
            </div>

            {/* Location + Network */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Network
              </h2>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2">
                <Row label="Provider" value={b.provider?.name} />
                <Row label="Location" value={[b.city, b.region, b.country?.name].filter(Boolean).join(', ') || undefined} />
                <Row label="IPv4" value={b.ipv4 ?? undefined} />
              </div>
            </div>

            {/* Workloads */}
            {aiAnalysis?.suitableWorkloads?.length && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Suitable Workloads</h2>
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysis.suitableWorkloads.map(w => (
                    <span key={w} className="px-2.5 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <span>Submitted: {formatDate(b.createdAt.toISOString())}</span>
            <Link href={`${siteUrl}/benchmarks/${b.uuid}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              View full benchmark ↗
            </Link>
          </div>
        </div>

        {/* QR code */}
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${siteUrl}/benchmarks/${b.uuid}`)}`}
            alt="QR code"
            width={120}
            height={120}
            className="rounded-lg border border-gray-200 dark:border-gray-700"
          />
          <p className="text-xs text-gray-400">Scan to view the full benchmark result</p>
          <button
            onClick={() => {}}
            className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 print:hidden"
            id="print-btn"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-btn')?.addEventListener('click', () => window.print());
      ` }} />
    </div>
  )
}
