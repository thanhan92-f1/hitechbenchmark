import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard'
import { formatScore, getScoreColor, cn } from '@/lib/utils'
import { Globe2, ExternalLink, Server, BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'

async function getProvider(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/providers/${slug}`,
      { next: { revalidate: 300 } },
    )
    if (res.status === 404) return null
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

async function getProviderBenchmarks(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/providers/${slug}/benchmarks?per_page=9`,
      { next: { revalidate: 120 } },
    )
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const p = await getProvider(slug)
  if (!p) return { title: 'Provider Not Found' }

  return {
    title: `${p.name} — VPS Provider Benchmarks`,
    description: `Benchmark results for ${p.name}. ${p.benchmarkCount} benchmarks, avg score ${p.avgScore?.toFixed(1) ?? '—'}.`,
    openGraph: {
      title: `${p.name} Benchmark Results | HiTech Benchmark`,
      description: `${p.benchmarkCount} benchmark results for ${p.name}`,
    },
  }
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  async function getPlans(s: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/providers/${s}/plans`, { next: { revalidate: 300 } })
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    } catch { return [] }
  }

  const [provider, benchmarks, plans] = await Promise.all([
    getProvider(slug),
    getProviderBenchmarks(slug),
    getPlans(slug),
  ])

  if (!provider) notFound()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-10">
        <div className="flex-shrink-0">
          {provider.logoUrl ? (
            <img
              src={provider.logoUrl}
              alt={provider.name}
              className="w-20 h-20 object-contain rounded-xl border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{provider.name}</h1>
            {provider.country && (
              <Badge variant="outline">{provider.country.flagEmoji} {provider.country.name}</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            {provider.asn && (
              <span className="font-mono">AS{provider.asn.asnNumber} — {provider.asn.name}</span>
            )}
            {provider.websiteUrl && (
              <a
                href={provider.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                {provider.websiteUrl.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {provider.benchmarkCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">Benchmarks</div>
            </div>
            {provider.avgScore != null && (
              <div className="text-center">
                <div className={cn('text-3xl font-bold font-mono', getScoreColor(provider.avgScore))}>
                  {formatScore(provider.avgScore)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Avg Score</div>
              </div>
            )}
            {provider.uptimeRating != null && (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {provider.uptimeRating.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Uptime</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score breakdown if available */}
      {provider.avgScore != null && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Average Performance Score</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className={cn('text-5xl font-bold font-mono', getScoreColor(provider.avgScore))}>
                {formatScore(provider.avgScore)}
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', {
                      'bg-green-500': provider.avgScore >= 80,
                      'bg-blue-500': provider.avgScore >= 60 && provider.avgScore < 80,
                      'bg-yellow-500': provider.avgScore >= 40 && provider.avgScore < 60,
                      'bg-red-500': provider.avgScore < 40,
                    })}
                    style={{ width: `${Math.min(provider.avgScore, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Based on {provider.benchmarkCount} public benchmark{provider.benchmarkCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Plans & Price/Performance */}
      {plans.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Plans & Price/Performance</h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-2.5 font-medium">Plan</th>
                    <th className="px-4 py-2.5 font-medium text-right">vCPU</th>
                    <th className="px-4 py-2.5 font-medium text-right">RAM</th>
                    <th className="px-4 py-2.5 font-medium text-right">Disk</th>
                    <th className="px-4 py-2.5 font-medium text-right">Bandwidth</th>
                    <th className="px-4 py-2.5 font-medium text-right">Price/mo</th>
                    {provider.avgScore != null && <th className="px-4 py-2.5 font-medium text-right">Score/$ ratio</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(plans as {
                    id: string; name: string; vcpu?: number | null; ramGb?: number | null;
                    diskGb?: number | null; diskType?: string | null; bandwidthTb?: number | null;
                    priceUsd?: number | null; sourceUrl?: string | null
                  }[]).map(plan => {
                    const ratio = plan.priceUsd && provider.avgScore
                      ? (provider.avgScore / plan.priceUsd).toFixed(2)
                      : null
                    return (
                      <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {plan.sourceUrl ? (
                            <a href={plan.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {plan.name}
                            </a>
                          ) : plan.name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{plan.vcpu ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{plan.ramGb ? `${plan.ramGb} GB` : '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                          {plan.diskGb ? `${plan.diskGb} GB${plan.diskType ? ` ${plan.diskType.toUpperCase()}` : ''}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{plan.bandwidthTb ? `${plan.bandwidthTb} TB` : '—'}</td>
                        <td className="px-4 py-3 text-right font-mono text-green-600 dark:text-green-400">
                          {plan.priceUsd ? `$${plan.priceUsd.toFixed(2)}` : '—'}
                        </td>
                        {provider.avgScore != null && (
                          <td className="px-4 py-3 text-right font-mono text-purple-600 dark:text-purple-400">
                            {ratio ?? '—'}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent benchmarks */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Benchmarks</h2>
        </div>
        <Link
          href={`/benchmarks?provider=${slug}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all →
        </Link>
      </div>

      {benchmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benchmarks.map((b: Parameters<typeof BenchmarkCard>[0]['benchmark']) => (
            <BenchmarkCard key={b.uuid} benchmark={b} />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <Server className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No public benchmarks for this provider yet.</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
