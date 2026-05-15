import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard'
import { Key, Server } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login?next=/dashboard')

  const [benchmarks, apiTokens] = await Promise.all([
    db.benchmark.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, uuid: true, hostname: true, osName: true, cpuModel: true,
        cpuCores: true, ramTotalMb: true, virtualization: true, ipv4: true,
        city: true, status: true, visibility: true, createdAt: true, publicSlug: true,
        country: { select: { code: true, name: true, flagEmoji: true } },
        provider: { select: { name: true, slug: true } },
        scores: { select: { totalScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    db.apiToken.findMany({
      where: { userId: session.user.id, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {session.user.name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{session.user.email}</p>
      </div>

      {/* My Benchmarks */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            My Benchmarks ({benchmarks.length})
          </h2>
        </div>

        {benchmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchmarks.map((b) => (
              <div key={b.uuid} className="relative">
                <BenchmarkCard
                  benchmark={{
                    ...b,
                    totalScore: b.scores[0]?.totalScore ?? null,
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={b.visibility === 'public' ? 'success' : 'outline'}>
                    {b.visibility}
                  </Badge>
                  <Badge
                    variant={
                      b.status === 'completed' ? 'success' :
                      b.status === 'failed' ? 'error' :
                      b.status === 'flagged' ? 'warning' : 'info'
                    }
                  >
                    {b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-10">
              <Server className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No benchmarks yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Run the benchmark script with your API token to link results to your account.
              </p>
            </CardBody>
          </Card>
        )}
      </section>

      {/* API Tokens */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Tokens</h2>
          </div>
        </div>

        <Card>
          {apiTokens.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {apiTokens.map((token) => (
                <div key={token.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{token.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Created {timeAgo(token.createdAt)}
                      {token.lastUsedAt && ` · Last used ${timeAgo(token.lastUsedAt)}`}
                      {token.expiresAt && ` · Expires ${timeAgo(token.expiresAt)}`}
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          ) : (
            <CardBody className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No API tokens yet. Create one to link benchmark submissions to your account.
              </p>
            </CardBody>
          )}
        </Card>
      </section>
    </div>
  )
}
