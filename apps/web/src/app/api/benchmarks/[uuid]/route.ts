import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params

  const benchmark = await db.benchmark.findUnique({
    where: {
      uuid,
      visibility: 'public',
      deletedAt: null,
    },
    include: {
      country: true,
      provider: { select: { id: true, name: true, slug: true, logoUrl: true, websiteUrl: true } },
      asn: { select: { asnNumber: true, name: true, organization: true } },
      results: true,
      scores: { orderBy: { createdAt: 'desc' }, take: 1 },
      locations: { orderBy: { pingMs: 'asc' } },
    },
  })

  if (!benchmark) {
    return apiError('Benchmark not found', 404)
  }

  return apiResponse({
    ...benchmark,
    uptimeSeconds: benchmark.uptimeSeconds?.toString(),
  })
}
