import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { timeAgo, formatScore, getScoreColor, cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - Benchmarks',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  completed: 'success',
  pending: 'warning',
  processing: 'info',
  failed: 'error',
  flagged: 'error',
}

async function getBenchmarks(params: Record<string, string>) {
  try {
    const sp = new URLSearchParams(params)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/benchmarks?${sp.toString()}`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return { data: json.data || [], meta: json.meta }
  } catch {
    return { data: [], meta: null }
  }
}

export default async function AdminBenchmarksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) redirect('/login')

  const params = await searchParams
  const { data: benchmarks, meta } = await getBenchmarks(params)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Benchmarks</h1>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">← Admin Home</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'pending', 'completed', 'flagged', 'failed'].map((s) => (
          <a
            key={s}
            href={s === 'all' ? '/admin/benchmarks' : `/admin/benchmarks?status=${s}`}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg border transition-colors',
              params.status === s || (!params.status && s === 'all')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Host', 'IP', 'Status', 'Visibility', 'Trust', 'Flags', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {benchmarks.map((b: {
                id: string; uuid: string; hostname?: string; ipv4?: string;
                status: string; visibility: string; trustScore: number;
                createdAt: string; _count: { flags: number };
                country?: { code: string }; provider?: { name: string };
              }) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <Link href={`/benchmarks/${b.uuid}`} className="text-blue-600 hover:underline font-mono text-xs">
                      {b.hostname || b.uuid.slice(0, 12)}
                    </Link>
                    {b.provider && (
                      <div className="text-xs text-gray-400">{b.provider.name}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{b.ipv4 || '—'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={statusVariant[b.status] || 'default'}>{b.status}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={b.visibility === 'public' ? 'success' : 'outline'}>
                      {b.visibility}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('font-mono text-sm', getScoreColor(b.trustScore * 100))}>
                      {(b.trustScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {b._count.flags > 0 && (
                      <Badge variant="error">{b._count.flags}</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{timeAgo(b.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/benchmarks/${b.uuid}`}
                        className="text-xs text-blue-600 hover:underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500">
            <span>Total: {meta.total.toLocaleString()} benchmarks</span>
            <div className="flex gap-2">
              {parseInt(params.page || '1') > 1 && (
                <a href={`?page=${parseInt(params.page || '1') - 1}`} className="text-blue-600 hover:underline">Previous</a>
              )}
              {meta.hasNext && (
                <a href={`?page=${parseInt(params.page || '1') + 1}`} className="text-blue-600 hover:underline">Next</a>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
