import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { timeAgo, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - Promotions',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin']

async function getPromotions(params: Record<string, string>) {
  try {
    const sp = new URLSearchParams(params)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/promotions?${sp.toString()}`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return { data: json.data || [], meta: json.meta }
  } catch {
    return { data: [], meta: null }
  }
}

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) redirect('/login')

  const params = await searchParams
  const { data: promotions, meta } = await getPromotions(params)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Promotions</h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Title', 'Provider', 'Price', 'Coupon', 'Ends At', 'Status', 'Created'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {promotions.map((p: {
                id: string; title: string; price?: number; currency?: string;
                couponCode?: string; isActive: boolean; createdAt: string; endsAt?: string;
                provider: { name: string; slug: string };
              }) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white max-w-xs truncate">{p.title}</div>
                  </td>
                  <td className="py-3 px-4 text-blue-600 dark:text-blue-400">{p.provider.name}</td>
                  <td className="py-3 px-4 text-green-600 font-mono">
                    {p.price != null ? `$${p.price}/${p.currency || 'mo'}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {p.couponCode ? (
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {p.couponCode}
                      </code>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {p.endsAt ? formatDate(p.endsAt) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={p.isActive ? 'success' : 'error'}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{timeAgo(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {promotions.length === 0 && (
            <div className="text-center py-12 text-gray-400">No promotions found</div>
          )}
        </div>
      </Card>
    </div>
  )
}
