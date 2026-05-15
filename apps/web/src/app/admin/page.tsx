import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Server, Users, Flag, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

async function getAdminStats() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/stats`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect('/login?next=/admin')
  }

  const stats = await getAdminStats()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Logged in as <span className="text-blue-600">{session.user.email}</span>
            <Badge variant="info" className="ml-2">{session.user.role}</Badge>
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Benchmarks',
              value: stats.benchmarks.total,
              sub: `${stats.benchmarks.today} today`,
              icon: Server,
              color: 'text-blue-600',
            },
            {
              label: 'Pending',
              value: stats.benchmarks.pending,
              sub: `${stats.benchmarks.failed} failed`,
              icon: Clock,
              color: 'text-yellow-600',
            },
            {
              label: 'Flagged',
              value: stats.benchmarks.flagged,
              sub: `${stats.openFlags} open flags`,
              icon: Flag,
              color: 'text-red-600',
            },
            {
              label: 'Users',
              value: stats.users,
              sub: `${stats.providers} providers`,
              icon: Users,
              color: 'text-green-600',
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label}>
              <CardBody className="flex items-center gap-3 py-5">
                <div className={`p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Queue Status */}
      {stats?.queue && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-white">Queue Status</h2>
          </CardHeader>
          <CardBody>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.queue.waiting}</div>
                <div className="text-xs text-gray-500">Waiting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.queue.active}</div>
                <div className="text-xs text-gray-500">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.queue.failed}</div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/admin/benchmarks', label: 'Manage Benchmarks', desc: 'Review, flag, and manage all benchmark submissions', icon: Server },
          { href: '/admin/providers', label: 'Manage Providers', desc: 'Add, edit, and merge VPS providers', icon: CheckCircle2 },
          { href: '/admin/flags', label: 'Abuse Flags', desc: 'Review flagged and suspicious benchmarks', icon: Flag },
          { href: '/admin/users', label: 'Manage Users', desc: 'View users, change roles, revoke access', icon: Users },
          { href: '/admin/promotions', label: 'Promotions', desc: 'Manage VPS deals and coupons', icon: AlertTriangle },
          { href: '/admin/audit-logs', label: 'Audit Logs', desc: 'View admin action history', icon: Clock },
        ].map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card hover>
              <CardBody className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
