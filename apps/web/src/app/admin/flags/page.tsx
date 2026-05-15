import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { timeAgo, cn } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - Abuse Flags',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator']

async function getFlags(params: Record<string, string>) {
  try {
    const sp = new URLSearchParams(params)
    if (!sp.has('status')) sp.set('status', 'pending')
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/flags?${sp.toString()}`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return { data: json.data || [], meta: json.meta }
  } catch {
    return { data: [], meta: null }
  }
}

const severityVariant: Record<string, 'error' | 'warning' | 'default'> = {
  high: 'error', medium: 'warning', low: 'default',
}

export default async function AdminFlagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) redirect('/login')

  const params = await searchParams
  const { data: flags, meta } = await getFlags(params)
  const currentStatus = params.status || 'pending'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Abuse Flags</h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <a
            key={s}
            href={s === 'all' ? '/admin/flags' : `/admin/flags?status=${s}`}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize',
              currentStatus === s || (!params.status && s === 'pending')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {s}
          </a>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Benchmark', 'Rule', 'Severity', 'Status', 'Submitted', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {flags.map((f: {
                id: string; reason: string; severity: string; status: string;
                createdAt: string; metadata?: { detail?: string };
                benchmark: {
                  uuid: string; hostname?: string; ipv4?: string; trustScore: number;
                  country?: { code: string }; provider?: { name: string };
                };
              }) => (
                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <Link
                      href={`/benchmarks/${f.benchmark.uuid}`}
                      target="_blank"
                      className="text-blue-600 hover:underline font-mono text-xs"
                    >
                      {f.benchmark.hostname || f.benchmark.uuid.slice(0, 12)}
                    </Link>
                    <div className="text-xs text-gray-400">{f.benchmark.provider?.name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{f.reason}</div>
                    {f.metadata?.detail && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{f.metadata.detail}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={severityVariant[f.severity] || 'default'}>{f.severity}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={
                      f.status === 'approved' ? 'error' :
                      f.status === 'rejected' ? 'success' : 'warning'
                    }>
                      {f.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{timeAgo(f.createdAt)}</td>
                  <td className="py-3 px-4">
                    {f.status === 'pending' && (
                      <div className="flex gap-2">
                        <FlagAction id={f.id} action="approved" label="Approve" />
                        <FlagAction id={f.id} action="rejected" label="Reject" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flags.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No {currentStatus} flags found
            </div>
          )}
        </div>
        {meta && meta.total > meta.perPage && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500">
            <span>Total: {meta.total} flags</span>
            <div className="flex gap-2">
              {parseInt(params.page || '1') > 1 && (
                <a href={`?page=${parseInt(params.page || '1') - 1}&status=${currentStatus}`} className="text-blue-600 hover:underline">Previous</a>
              )}
              {meta.hasNext && (
                <a href={`?page=${parseInt(params.page || '1') + 1}&status=${currentStatus}`} className="text-blue-600 hover:underline">Next</a>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function FlagAction({ id, action, label }: { id: string; action: string; label: string }) {
  return (
    <form
      action={`/api/admin/flags?id=${id}`}
      method="POST"
    >
      <input type="hidden" name="_method" value="PATCH" />
      <input type="hidden" name="status" value={action} />
      <button
        type="submit"
        className={cn(
          'text-xs px-2 py-1 rounded border transition-colors',
          action === 'approved'
            ? 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
        )}
      >
        {label}
      </button>
    </form>
  )
}
