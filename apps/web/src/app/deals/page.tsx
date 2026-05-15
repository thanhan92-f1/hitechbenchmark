import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tag, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VPS Deals & Promotions',
  description: 'Find the best VPS deals, coupons, and promotions from top hosting providers.',
}

async function getPromotions(searchParams: Record<string, string>) {
  try {
    const params = new URLSearchParams(searchParams)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/promotions?${params.toString()}`,
      { next: { revalidate: 300 } },
    )
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const promotions = await getPromotions(params)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">VPS Deals & Promotions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Exclusive deals and coupons from hosting providers
        </p>
      </div>

      {promotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo: {
            id: string; title: string; description?: string; couponCode?: string;
            price?: number; currency?: string; endsAt?: string;
            provider: { name: string; slug: string; logoUrl?: string; websiteUrl?: string };
            country?: { name: string; flagEmoji?: string };
          }) => (
            <Card key={promo.id} className="flex flex-col">
              <CardBody className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  {promo.provider.logoUrl ? (
                    <img
                      src={promo.provider.logoUrl}
                      alt={promo.provider.name}
                      className="w-8 h-8 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-sm">
                      {promo.country?.flagEmoji || '🌐'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">{promo.title}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">{promo.provider.name}</div>
                  </div>
                  {promo.price != null && (
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">
                        ${promo.price}/{promo.currency || 'mo'}
                      </div>
                    </div>
                  )}
                </div>

                {promo.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {promo.description}
                  </p>
                )}

                {promo.couponCode && (
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {promo.couponCode}
                    </code>
                    <Badge variant="success">Coupon</Badge>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                  {promo.endsAt && (
                    <span className="text-xs text-gray-400">
                      Ends {formatDate(promo.endsAt)}
                    </span>
                  )}
                  {promo.provider.websiteUrl && (
                    <a
                      href={promo.provider.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                    >
                      Visit <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <Tag className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No deals available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Check back soon for VPS deals and promotions.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
