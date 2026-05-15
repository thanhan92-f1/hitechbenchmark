import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const provider = await db.provider.findUnique({
    where: { slug, isActive: true },
    include: {
      country: true,
      asn: true,
      benchmarks: {
        where: { visibility: 'public', status: 'completed', deletedAt: null },
        orderBy: [{ scores: { _count: 'desc' } }],
        take: 10,
        select: {
          uuid: true,
          hostname: true,
          cpuModel: true,
          cpuCores: true,
          ramTotalMb: true,
          virtualization: true,
          city: true,
          createdAt: true,
          scores: { select: { totalScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
      promotions: {
        where: { isActive: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!provider) {
    return apiError('Provider not found', 404)
  }

  return apiResponse(provider)
}
