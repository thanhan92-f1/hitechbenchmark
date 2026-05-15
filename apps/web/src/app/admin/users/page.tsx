import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { timeAgo, cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { BlockUserButton, ChangeRoleSelect } from '@/components/admin/UserActions'

export const metadata: Metadata = {
  title: 'Admin - Users',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin']

async function getUsers(params: Record<string, string>) {
  try {
    const sp = new URLSearchParams(params)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/users?${sp.toString()}`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return { data: json.data || [], meta: json.meta }
  } catch {
    return { data: [], meta: null }
  }
}

const roleVariant: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  super_admin: 'error',
  admin: 'warning',
  moderator: 'info',
  support: 'default',
  user: 'default',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) redirect('/login')

  const params = await searchParams
  const { data: users, meta } = await getUsers(params)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Users
        </h1>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'user', 'moderator', 'admin', 'super_admin'].map((r) => (
          <a
            key={r}
            href={r === 'all' ? '/admin/users' : `/admin/users?role=${r}`}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg border capitalize transition-colors',
              params.role === r || (!params.role && r === 'all')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {r.replace('_', ' ')}
          </a>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['User', 'Role', 'Status', 'Benchmarks', 'Tokens', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u: {
                id: string; name: string; email: string; role: string;
                isActive: boolean; createdAt: string;
                _count: { benchmarks: number; apiTokens: number };
              }) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <ChangeRoleSelect userId={u.id} currentRole={u.role} />
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={u.isActive ? 'success' : 'error'}>
                      {u.isActive ? 'Active' : 'Blocked'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{u._count.benchmarks}</td>
                  <td className="py-3 px-4 text-gray-500">{u._count.apiTokens}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{timeAgo(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 text-xs">
                      <BlockUserButton userId={u.id} isActive={u.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">No users found</div>
          )}
        </div>
        {meta && meta.total > meta.perPage && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500">
            <span>Total: {meta.total} users</span>
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

