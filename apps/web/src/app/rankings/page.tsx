import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatScore, formatRAM, getScoreColor, timeAgo, cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VPS Performance Rankings',
  description: 'Top ranked VPS and cloud servers by benchmark performance score.',
}

async function getRankings(params: Record<string, string>) {
  try {
    const sp = new URLSearchParams(params)
    if (!sp.has('per_page')) sp.set('per_page', '50')
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/rankings?${sp.toString()}`,
      { next: { revalidate: 120 } },
    )
    const json = await res.json()
    return json.data?.rankings || []
  } catch {
    return []
  }
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const rankings = await getRankings(params)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
          <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Rankings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Top VPS servers ranked by composite benchmark score
          </p>
        </div>
      </div>

      {/* Score weight explanation */}
      <Card className="mb-6">
        <CardBody className="py-3">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Score weights:</span>
            {[['CPU', '30%'], ['Disk', '25%'], ['Network', '25%'], ['Memory', '15%'], ['Security', '5%']].map(([label, pct]) => (
              <span key={label}>{label} <span className="text-blue-600 dark:text-blue-400 font-medium">{pct}</span></span>
            ))}
          </div>
        </CardBody>
      </Card>

      {rankings.length > 0 ? (
        <div className="space-y-2">
          {rankings.map((entry: {
            rank: number; totalScore: number; cpuScore?: number; diskScore?: number;
            networkScore?: number; memoryScore?: number;
            benchmark: {
              uuid: string; hostname?: string; cpuModel?: string; cpuCores?: number;
              ramTotalMb?: number; virtualization?: string; city?: string; createdAt: string;
              country?: { name: string; flagEmoji?: string };
              provider?: { name: string; slug: string; logoUrl?: string };
            }
          }) => (
            <Link key={entry.rank} href={`/benchmarks/${entry.benchmark.uuid}`}>
              <Card hover>
                <CardBody className="py-3">
                  <div className="flex items-center gap-4">
                    {/* Rank badge */}
                    <div className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                      entry.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                      entry.rank === 3 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                      'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                    )}>
                      #{entry.rank}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {entry.benchmark.hostname || entry.benchmark.uuid?.slice(0, 12)}
                        </span>
                        {entry.benchmark.virtualization && (
                          <Badge variant="outline">{entry.benchmark.virtualization.toUpperCase()}</Badge>
                        )}
                        {entry.benchmark.provider && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            @ {entry.benchmark.provider.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {entry.benchmark.cpuModel && (
                          <span>{entry.benchmark.cpuModel}{entry.benchmark.cpuCores ? ` (${entry.benchmark.cpuCores}c)` : ''}</span>
                        )}
                        {entry.benchmark.ramTotalMb && <span>{formatRAM(entry.benchmark.ramTotalMb)}</span>}
                        {entry.benchmark.country && (
                          <span>{entry.benchmark.country.flagEmoji} {entry.benchmark.city ? `${entry.benchmark.city}, ` : ''}{entry.benchmark.country.name}</span>
                        )}
                        <span>{timeAgo(entry.benchmark.createdAt)}</span>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
                      {entry.cpuScore != null && <span>CPU: <span className="text-blue-500">{entry.cpuScore.toFixed(1)}</span></span>}
                      {entry.diskScore != null && <span>Disk: <span className="text-yellow-500">{entry.diskScore.toFixed(1)}</span></span>}
                      {entry.networkScore != null && <span>Net: <span className="text-green-500">{entry.networkScore.toFixed(1)}</span></span>}
                    </div>

                    {/* Total Score */}
                    <div className={cn('flex-shrink-0 text-2xl font-bold font-mono', getScoreColor(entry.totalScore))}>
                      {formatScore(entry.totalScore)}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No rankings yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Rankings will appear after benchmarks are submitted and scored.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
