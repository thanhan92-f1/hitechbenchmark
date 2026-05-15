import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatScore, getScoreColor, cn } from '@/lib/utils'
import { Globe2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - Providers',
  robots: { index: false, follow: false },
}

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

async function getProviders() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/providers`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export default async function AdminProvidersPage() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) redirect('/login')

  const providers = await getProviders()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Providers</h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Provider', 'Country', 'ASN', 'Benchmarks', 'Avg Score', 'Uptime', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {providers.map((p: {
                id: string; slug: string; name: string; logoUrl?: string;
                avgScore?: number; benchmarkCount: number; uptimeRating?: number; isActive: boolean;
                country?: { code: string; name: string; flagEmoji?: string };
                asn?: { asnNumber: number; name: string };
                _count: { benchmarks: number; promotions: number };
              }) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {p.logoUrl ? (
                        <img src={p.logoUrl} alt={p.name} className="w-6 h-6 object-contain" />
                      ) : (
                        <Globe2 className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {p.country ? `${p.country.flagEmoji} ${p.country.name}` : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">
                    {p.asn ? `AS${p.asn.asnNumber}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{p.benchmarkCount}</td>
                  <td className="py-3 px-4">
                    {p.avgScore != null ? (
                      <span className={cn('font-mono font-bold', getScoreColor(p.avgScore))}>
                        {formatScore(p.avgScore)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {p.uptimeRating != null ? `${p.uptimeRating.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={p.isActive ? 'success' : 'error'}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <a href={`/providers/${p.slug}`} target="_blank" className="text-xs text-blue-600 hover:underline">
                        View
                      </a>
                      <a href={`/admin/providers/${p.slug}/plans`} className="text-xs text-purple-600 hover:underline">
                        Plans
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {providers.length === 0 && (
            <div className="text-center py-12 text-gray-400">No providers found</div>
          )}
        </div>
      </Card>
    </div>
  )
}
