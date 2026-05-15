import { CheckCircle, XCircle, AlertCircle, Activity, Database, Server, Zap } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status — HiTech Benchmark',
  description: 'Real-time status of HiTech Benchmark platform services',
}

export const dynamic = 'force-dynamic'

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down'
  latencyMs?: number
}

interface StatusPayload {
  status: 'operational' | 'degraded' | 'down'
  timestamp: string
  services: {
    database: ServiceStatus
    cache: ServiceStatus
    api: ServiceStatus
  }
  stats: {
    totalBenchmarks: number
    benchmarksLast24h: number
    pendingJobs: number
  }
}

async function getStatus(): Promise<StatusPayload | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/status`, { cache: 'no-store' })
    return res.json()
  } catch {
    return null
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'operational') return <CheckCircle className="w-5 h-5 text-green-500" />
  if (status === 'degraded') return <AlertCircle className="w-5 h-5 text-yellow-500" />
  return <XCircle className="w-5 h-5 text-red-500" />
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    operational: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    degraded: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    down: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  }[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${styles}`}>
      {status}
    </span>
  )
}

const SERVICE_META = [
  { key: 'database' as const, label: 'Database (PostgreSQL)', icon: Database },
  { key: 'cache' as const, label: 'Cache (Redis)', icon: Zap },
  { key: 'api' as const, label: 'API Server', icon: Server },
]

export default async function StatusPage() {
  const data = await getStatus()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Status</h1>
        </div>

        {data ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <StatusIcon status={data.status} />
              <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {data.status === 'operational' ? 'All Systems Operational' :
                 data.status === 'degraded' ? 'Partial Outage' : 'Major Outage'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last checked: {new Date(data.timestamp).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-gray-500">Unable to fetch status</p>
        )}
      </div>

      {/* Services */}
      <Card className="mb-6">
        <CardBody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data ? SERVICE_META.map(({ key, label, icon: Icon }) => {
            const svc = data.services[key]
            return (
              <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    {svc.latencyMs != null && (
                      <p className="text-xs text-gray-400">{svc.latencyMs}ms response time</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={svc.status} />
              </div>
            )
          }) : (
            <div className="py-4 text-center text-sm text-gray-400">Failed to load service status</div>
          )}
        </CardBody>
      </Card>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Benchmarks', value: data.stats.totalBenchmarks.toLocaleString() },
            { label: 'Last 24h', value: data.stats.benchmarksLast24h.toLocaleString() },
            { label: 'Queue Depth', value: data.stats.pendingJobs.toLocaleString() },
          ].map(s => (
            <Card key={s.label}>
              <CardBody className="text-center py-4">
                <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
