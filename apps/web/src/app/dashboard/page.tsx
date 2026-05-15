import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard'
import { Key, Server, Activity, ShieldCheck } from 'lucide-react'
import { VisibilityToggle } from '@/components/dashboard/VisibilityToggle'
import { ApiTokenManager } from '@/components/dashboard/ApiTokenManager'
import type { Metadata } from 'next'
import Link from 'next/link'

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
      select: { id: true, name: true, createdAt: true, lastUsedAt: true, expiresAt: true },
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
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <VisibilityToggle
                    uuid={b.uuid}
                    initial={b.visibility as 'public' | 'private'}
                  />
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

      {/* Historical Monitoring */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historical Monitoring</h2>
          </div>
          <Link href="/dashboard/monitoring" className="text-sm text-blue-600 hover:underline">
            Manage →
          </Link>
        </div>
        <Card>
          <CardBody className="text-sm text-gray-500 dark:text-gray-400">
            Track your VPS performance over time with scheduled benchmarks.{' '}
            <Link href="/dashboard/monitoring" className="text-blue-600 hover:underline">Set up monitoring →</Link>
          </CardBody>
        </Card>
      </section>

      {/* Security & MFA */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
          </div>
          <Link href="/dashboard/security" className="text-sm text-blue-600 hover:underline">
            Manage →
          </Link>
        </div>
        <Card>
          <CardBody className="text-sm text-gray-500 dark:text-gray-400">
            Protect your account with two-factor authentication (Google Authenticator, Passkey, or Email 2FA).{' '}
            <Link href="/dashboard/security" className="text-blue-600 hover:underline">Set up MFA →</Link>
          </CardBody>
        </Card>
      </section>

      {/* API Tokens */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Tokens</h2>
        </div>

        <Card>
          <ApiTokenManager
            initial={apiTokens.map((t) => ({
              ...t,
              createdAt: t.createdAt.toISOString(),
              lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
              expiresAt: t.expiresAt?.toISOString() ?? null,
            }))}
          />
        </Card>
      </section>
    </div>
  )
}
