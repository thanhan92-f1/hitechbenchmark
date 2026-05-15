import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const tokenHash = createHash('sha256').update(token).digest('hex')

  const benchmark = await db.benchmark.findUnique({
    where: {
      privateTokenHash: tokenHash,
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
    return apiError('Benchmark not found or private link is invalid', 404)
  }

  return apiResponse({
    ...benchmark,
    uptimeSeconds: benchmark.uptimeSeconds?.toString(),
    // Do not expose the private token hash in the response
    privateTokenHash: undefined,
  })
}
