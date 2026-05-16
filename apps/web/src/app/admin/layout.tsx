import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Server, Globe2, Flag, Users, Tag,
  FileText, Settings, Activity,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/benchmarks', label: 'Benchmarks', icon: Server },
  { href: '/admin/providers', label: 'Providers', icon: Globe2 },
  { href: '/admin/flags', label: 'Abuse Flags', icon: Flag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/promotions', label: 'Promotions', icon: Tag },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect('/login?next=/admin')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Admin Panel</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{session.user.role}</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile breadcrumb */}
        <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900 dark:text-white">Admin</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500 dark:text-gray-400">{session.user.role}</span>
        </div>
        {children}
      </main>
    </div>
  )
}
