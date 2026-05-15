import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { timeAgo } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - Audit Logs',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin']

async function getLogs(params: Record<string, string>) {
  try {
    const sp = new URLSearchParams(params)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/audit-logs?${sp.toString()}`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return { data: json.data || [], meta: json.meta }
  } catch {
    return { data: [], meta: null }
  }
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) redirect('/login')

  const params = await searchParams
  const { data: logs, meta } = await getLogs(params)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Admin', 'Action', 'Entity', 'Entity ID', 'Time'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.map((log: {
                id: string; action: string; entityType: string; entityId?: string;
                createdAt: string;
                adminUser: { name: string; email: string };
              }) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white text-xs">{log.adminUser.name}</div>
                    <div className="text-xs text-gray-400">{log.adminUser.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                      {log.action}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{log.entityType}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">
                    {log.entityId?.slice(0, 12) || '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-400">No audit logs found</div>
          )}
        </div>
        {meta && meta.total > meta.perPage && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500">
            <span>Total: {meta.total} logs</span>
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
