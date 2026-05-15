import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatScore, getScoreColor, cn } from '@/lib/utils'
import { Globe2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VPS Providers',
  description: 'Browse and compare VPS and cloud server providers by benchmark performance.',
}

async function getProviders(searchParams: Record<string, string>) {
  const params = new URLSearchParams(searchParams)
  if (!params.has('per_page')) params.set('per_page', '30')

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/providers?${params.toString()}`,
      { next: { revalidate: 300 } },
    )
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const providers = await getProviders(params)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">VPS Providers</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {providers.length} providers ranked by benchmark performance
        </p>
      </div>

      {providers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {providers.map((p: {
            slug: string; name: string; logoUrl?: string; websiteUrl?: string;
            avgScore?: number; benchmarkCount: number; uptimeRating?: number;
            country?: { code: string; name: string; flagEmoji?: string };
            asn?: { asnNumber: number; name: string };
          }) => (
            <Link key={p.slug} href={`/providers/${p.slug}`}>
              <Card hover className="h-full">
                <CardBody>
                  <div className="flex items-start gap-3 mb-3">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="w-10 h-10 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-xl">
                        {p.country?.flagEmoji || '🌐'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</h3>
                      {p.country && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.country.flagEmoji} {p.country.name}
                        </p>
                      )}
                    </div>
                    {p.avgScore != null && (
                      <span className={cn('text-xl font-bold font-mono', getScoreColor(p.avgScore))}>
                        {formatScore(p.avgScore)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{p.benchmarkCount} benchmarks</span>
                    {p.asn && <span>AS{p.asn.asnNumber}</span>}
                    {p.uptimeRating && (
                      <Badge variant="success">{p.uptimeRating.toFixed(0)}% uptime</Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <Globe2 className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No providers yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Providers are detected automatically when benchmarks are submitted.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
