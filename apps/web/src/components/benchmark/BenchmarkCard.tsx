import Link from 'next/link'
import { MapPin, Cpu, MemoryStick, HardDrive, Globe, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardFooter } from '@/components/ui/Card'
import { formatRAM, formatScore, getScoreColor, timeAgo, cn } from '@/lib/utils'

interface BenchmarkCardProps {
  benchmark: {
    uuid: string
    hostname?: string | null
    osName?: string | null
    cpuModel?: string | null
    cpuCores?: number | null
    ramTotalMb?: number | null
    virtualization?: string | null
    ipv4?: string | null
    city?: string | null
    totalScore?: number | null
    createdAt: string | Date
    country?: { code: string; name: string; flagEmoji?: string | null } | null
    provider?: { name: string; slug: string } | null
  }
  rank?: number
}

export function BenchmarkCard({ benchmark: b, rank }: BenchmarkCardProps) {
  const score = b.totalScore
  const scoreColor = score != null ? getScoreColor(score) : 'text-gray-400'

  return (
    <Link href={`/benchmarks/${b.uuid}`} className="block group">
      <Card hover className="transition-all duration-200">
        <CardBody className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-2">
                {rank && (
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                    {rank}
                  </span>
                )}
                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {b.hostname || b.ipv4 || 'Unknown Host'}
                </span>
                {b.virtualization && (
                  <Badge variant="outline" className="text-xs">{b.virtualization.toUpperCase()}</Badge>
                )}
              </div>

              {/* CPU + RAM row */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                {b.cpuModel && (
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {b.cpuModel.length > 30 ? b.cpuModel.slice(0, 30) + '…' : b.cpuModel}
                    {b.cpuCores && ` (${b.cpuCores}c)`}
                  </span>
                )}
                {b.ramTotalMb && (
                  <span className="flex items-center gap-1">
                    <MemoryStick className="w-3 h-3" />
                    {formatRAM(b.ramTotalMb)}
                  </span>
                )}
              </div>

              {/* Location row */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {b.country && (
                  <span className="flex items-center gap-1">
                    <span>{b.country.flagEmoji}</span>
                    <span>{b.city ? `${b.city}, ` : ''}{b.country.name}</span>
                  </span>
                )}
                {b.provider && (
                  <span className="text-blue-600 dark:text-blue-400">@ {b.provider.name}</span>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="flex-shrink-0 text-right">
              {score != null ? (
                <div>
                  <div className={cn('text-2xl font-bold font-mono', scoreColor)}>
                    {formatScore(score)}
                  </div>
                  <div className="text-xs text-gray-400">score</div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">-</div>
              )}
            </div>
          </div>
        </CardBody>
        <CardFooter className="py-2.5 flex items-center justify-between">
          <span className="text-xs text-gray-400">{timeAgo(b.createdAt)}</span>
          <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline">View details →</span>
        </CardFooter>
      </Card>
    </Link>
  )
}
