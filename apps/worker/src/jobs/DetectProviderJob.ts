import { PrismaClient } from '@hitechbenchmark/db'

const prisma = new PrismaClient()

export async function detectProvider({ benchmarkId }: { benchmarkId: string }) {
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    include: { asn: true },
  })

  if (!benchmark) return

  // Check if provider already assigned
  if (benchmark.providerId) return

  let providerId: string | undefined

  // 1. Try matching by ASN
  if (benchmark.asnId) {
    const provider = await prisma.provider.findFirst({
      where: { asnId: benchmark.asnId, isActive: true },
    })
    if (provider) providerId = provider.id
  }

  // 2. Try matching by ISP/organization name
  if (!providerId && (benchmark.isp || benchmark.organization)) {
    const searchTerm = benchmark.isp || benchmark.organization || ''
    const provider = await prisma.provider.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm.split(' ')[0], mode: 'insensitive' } },
        ],
      },
    })
    if (provider) providerId = provider.id
  }

  if (providerId) {
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: { providerId },
    })

    // Update provider benchmark count
    await prisma.provider.update({
      where: { id: providerId },
      data: { benchmarkCount: { increment: 1 } },
    })

    console.log(`[DetectProvider] Benchmark ${benchmarkId} linked to provider ${providerId}`)
  } else {
    console.log(`[DetectProvider] No provider found for benchmark ${benchmarkId}`)
  }
}
