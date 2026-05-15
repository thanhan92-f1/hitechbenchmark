import { db } from '@/lib/db'
import { apiError, apiResponse } from '@/lib/utils'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const provider = await db.provider.findUnique({ where: { slug }, select: { id: true } })
  if (!provider) return apiError('Provider not found', 404)

  const plans = await db.providerPlan.findMany({
    where: { providerId: provider.id, isActive: true },
    orderBy: [{ priceUsd: 'asc' }, { ramGb: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      vcpu: true,
      ramGb: true,
      diskGb: true,
      diskType: true,
      bandwidthTb: true,
      priceUsd: true,
      pricingModel: true,
      regionCode: true,
      sourceUrl: true,
    },
  })

  return apiResponse(plans)
}
