import { z } from 'zod'
import { db } from '@/lib/db'
import { apiResponse, apiError, getClientIp } from '@/lib/utils'
import { verifySignature, isTimestampValid, checkAndConsumeNonce, generatePublicSlug, generatePrivateToken } from '@/lib/signing'
import { runAntiFakeChecks } from '@/lib/anti-fake'
import { enqueueBenchmarkProcessing } from '@/lib/queue'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { PAYLOAD_MAX_BYTES } from '@hitechbenchmark/shared'
import type { BenchmarkPayload } from '@hitechbenchmark/shared'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/benchmarks - List public benchmarks
// ============================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')))
  const skip = (page - 1) * perPage

  // Filters
  const countryCode = searchParams.get('country')
  const providerSlug = searchParams.get('provider')
  const virtualization = searchParams.get('virtualization')
  const q = searchParams.get('q')?.trim()
  const sortBy = searchParams.get('sort_by') || 'createdAt'
  const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc'

  // Advanced filters
  const minRam = searchParams.get('min_ram') ? parseInt(searchParams.get('min_ram')!) : null
  const maxRam = searchParams.get('max_ram') ? parseInt(searchParams.get('max_ram')!) : null
  const minCores = searchParams.get('min_cores') ? parseInt(searchParams.get('min_cores')!) : null
  const maxCores = searchParams.get('max_cores') ? parseInt(searchParams.get('max_cores')!) : null
  const cpuType = searchParams.get('cpu_type') // 'arm' | 'amd' | 'intel'
  const minScore = searchParams.get('min_score') ? parseFloat(searchParams.get('min_score')!) : null
  const maxScore = searchParams.get('max_score') ? parseFloat(searchParams.get('max_score')!) : null

  const cpuTypeFilter = cpuType ? (() => {
    if (cpuType === 'arm') return { cpuModel: { contains: 'arm', mode: 'insensitive' as const } }
    if (cpuType === 'amd') return { cpuModel: { contains: 'amd', mode: 'insensitive' as const } }
    if (cpuType === 'intel') return { cpuModel: { contains: 'intel', mode: 'insensitive' as const } }
    return {}
  })() : {}

  const where = {
    visibility: 'public' as const,
    status: 'completed' as const,
    deletedAt: null,
    ...(countryCode && { country: { code: countryCode } }),
    ...(providerSlug && { provider: { slug: providerSlug } }),
    ...(virtualization && { virtualization }),
    ...(minRam || maxRam ? { ramTotalMb: { ...(minRam ? { gte: minRam } : {}), ...(maxRam ? { lte: maxRam } : {}) } } : {}),
    ...(minCores || maxCores ? { cpuCores: { ...(minCores ? { gte: minCores } : {}), ...(maxCores ? { lte: maxCores } : {}) } } : {}),
    ...cpuTypeFilter,
    ...(minScore || maxScore ? { scores: { some: { totalScore: { ...(minScore ? { gte: minScore } : {}), ...(maxScore ? { lte: maxScore } : {}) } } } } : {}),
    ...(q && {
      OR: [
        { hostname: { contains: q, mode: 'insensitive' as const } },
        { cpuModel: { contains: q, mode: 'insensitive' as const } },
        { ipv4: { contains: q } },
        { city: { contains: q, mode: 'insensitive' as const } },
        { isp: { contains: q, mode: 'insensitive' as const } },
        { organization: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [benchmarks, total] = await Promise.all([
    db.benchmark.findMany({
      where,
      skip,
      take: perPage,
      orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } : { createdAt: 'desc' },
      select: {
        id: true,
        uuid: true,
        hostname: true,
        osName: true,
        cpuModel: true,
        cpuCores: true,
        ramTotalMb: true,
        virtualization: true,
        ipv4: true,
        city: true,
        region: true,
        publicSlug: true,
        createdAt: true,
        country: { select: { code: true, name: true, flagEmoji: true } },
        provider: { select: { id: true, name: true, slug: true, logoUrl: true } },
        scores: {
          select: { totalScore: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    db.benchmark.count({ where }),
  ])

  const data = benchmarks.map((b) => ({
    ...b,
    totalScore: b.scores[0]?.totalScore ?? null,
    scores: undefined,
  }))

  return apiResponse(data, {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
  })
}

// ============================================================
// POST /api/benchmarks - Submit benchmark result
// ============================================================

const benchmarkPayloadSchema = z.object({
  benchmark_type: z.enum(['public', 'private']),
  client_version: z.string().max(20),
  timestamp: z.number().int(),
  nonce: z.string().min(16).max(64),
  signature: z.string().length(64),
  system: z.object({
    hostname: z.string().max(255),
    os_name: z.string().max(100),
    os_version: z.string().max(100),
    kernel: z.string().max(100),
    architecture: z.string().max(20),
    virtualization: z.string().max(50),
    cpu_model: z.string().max(255),
    cpu_cores: z.number().int().min(1).max(512),
    cpu_threads: z.number().int().min(1).max(1024),
    cpu_frequency_mhz: z.number().min(0).max(20000),
    ram_total_mb: z.number().int().min(64).max(4194304), // max 4TB
    swap_total_mb: z.number().int().min(0),
    disk_total_gb: z.number().min(0),
    uptime_seconds: z.number().int().min(0),
    load_average: z.string().max(50),
  }),
  network: z.object({
    ipv4: z.string().ip().optional().or(z.literal('')),
    ipv6: z.string().optional(),
    asn: z.number().int().optional(),
    isp: z.string().max(255).optional(),
    organization: z.string().max(255).optional(),
    reverse_dns: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    country_code: z.string().length(2).optional(),
  }),
  disk_results: z.array(
    z.object({
      device: z.string().max(50),
      dd_write_mbps: z.number().min(0).optional(),
      dd_read_mbps: z.number().min(0).optional(),
      fio_read_iops: z.number().min(0).optional(),
      fio_write_iops: z.number().min(0).optional(),
      fio_read_mbps: z.number().min(0).optional(),
      fio_write_mbps: z.number().min(0).optional(),
      fio_read_latency_ms: z.number().min(0).optional(),
      fio_write_latency_ms: z.number().min(0).optional(),
    }),
  ).max(10),
  cpu_results: z.object({
    sysbench_single_score: z.number().min(0).optional(),
    sysbench_multi_score: z.number().min(0).optional(),
    compression_score: z.number().min(0).optional(),
    events_per_second: z.number().min(0).optional(),
  }),
  memory_results: z.object({
    read_speed_mbps: z.number().min(0).optional(),
    write_speed_mbps: z.number().min(0).optional(),
    latency_ns: z.number().min(0).optional(),
  }),
  network_results: z.array(
    z.object({
      location: z.string().max(50),
      server_host: z.string().max(255),
      download_mbps: z.number().min(0).optional(),
      upload_mbps: z.number().min(0).optional(),
      ping_ms: z.number().min(0).optional(),
      jitter_ms: z.number().min(0).optional(),
    }),
  ).max(20),
  security: z.object({
    open_ports: z.array(z.number().int()).max(100).optional(),
    firewall_detected: z.boolean().optional(),
    kernel_hardening: z.record(z.boolean()).optional(),
    virtualization_type: z.string().max(50).optional(),
    cloud_provider: z.string().max(100).optional(),
    selinux: z.boolean().optional(),
    apparmor: z.boolean().optional(),
  }),
})

export async function POST(request: Request) {
  const submitterIp = getClientIp(request)

  // Rate limit: 10 submissions per IP per minute
  const rl = await rateLimit(
    `benchmark:${submitterIp}`,
    parseInt(process.env.RATE_LIMIT_BENCHMARK_INGEST || '10'),
    parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60'),
  )

  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ success: false, message: 'Rate limit exceeded. Try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders(rl),
        },
      },
    )
  }

  // Check payload size
  const contentLength = parseInt(request.headers.get('content-length') || '0')
  if (contentLength > PAYLOAD_MAX_BYTES) {
    return apiError('Payload too large', 413)
  }

  let rawBody: string
  try {
    rawBody = await request.text()
    if (rawBody.length > PAYLOAD_MAX_BYTES) {
      return apiError('Payload too large', 413)
    }
  } catch {
    return apiError('Invalid request body', 400)
  }

  let payload: BenchmarkPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return apiError('Invalid JSON', 400)
  }

  // Validate schema
  const validated = benchmarkPayloadSchema.safeParse(payload)
  if (!validated.success) {
    return apiError('Validation failed', 422, validated.error.flatten().fieldErrors as Record<string, string[]>)
  }

  // Validate timestamp
  if (!isTimestampValid(payload.timestamp)) {
    return apiError('Payload timestamp is invalid or too old', 400)
  }

  // Validate nonce (replay protection)
  const nonceValid = await checkAndConsumeNonce(payload.nonce)
  if (!nonceValid) {
    return apiError('Nonce already used or invalid', 400)
  }

  // Verify HMAC signature
  const { signature, ...dataWithoutSig } = payload
  const signatureValid = verifySignature(dataWithoutSig, payload.nonce, payload.timestamp, signature)
  if (!signatureValid) {
    return apiError('Invalid signature', 401)
  }

  // Anti-fake checks
  const antiFake = runAntiFakeChecks(payload, submitterIp)

  // Generate URL tokens
  const publicSlug = generatePublicSlug()
  const privateTokenRaw = generatePrivateToken()
  const privateTokenHash = createHash('sha256').update(privateTokenRaw).digest('hex')

  // Create benchmark record
  const benchmark = await db.benchmark.create({
    data: {
      visibility: payload.benchmark_type,
      status: antiFake.passed ? 'pending' : 'flagged',
      hostname: payload.system.hostname,
      osName: payload.system.os_name,
      osVersion: payload.system.os_version,
      kernel: payload.system.kernel,
      architecture: payload.system.architecture,
      virtualization: payload.system.virtualization,
      cpuModel: payload.system.cpu_model,
      cpuCores: payload.system.cpu_cores,
      cpuThreads: payload.system.cpu_threads,
      cpuFrequencyMhz: payload.system.cpu_frequency_mhz,
      ramTotalMb: payload.system.ram_total_mb,
      swapTotalMb: payload.system.swap_total_mb,
      diskTotalGb: payload.system.disk_total_gb,
      uptimeSeconds: BigInt(payload.system.uptime_seconds),
      loadAverage: payload.system.load_average,
      ipv4: payload.network.ipv4,
      ipv6: payload.network.ipv6,
      isp: payload.network.isp,
      organization: payload.network.organization,
      reverseDns: payload.network.reverse_dns,
      city: payload.network.city,
      region: payload.network.region,
      rawPayload: payload as object,
      publicSlug,
      privateTokenHash,
      trustScore: antiFake.trustScore,
      clientVersion: payload.client_version,
      submitterIp,
    },
  })

  // Create abuse flags if detected
  if (antiFake.flags.length > 0) {
    await db.abuseFlag.createMany({
      data: antiFake.flags.map((flag) => ({
        benchmarkId: benchmark.id,
        reason: flag.rule,
        severity: flag.severity,
        status: 'pending',
        metadata: { detail: flag.detail },
      })),
    })
  }

  // Enqueue processing job
  await enqueueBenchmarkProcessing(benchmark.id)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  return Response.json(
    {
      success: true,
      data: {
        benchmark_id: benchmark.id,
        uuid: benchmark.uuid,
        status: benchmark.status,
        public_url: payload.benchmark_type === 'public' ? `${siteUrl}/benchmarks/${benchmark.uuid}` : null,
        private_url: `${siteUrl}/benchmarks/private/${privateTokenRaw}`,
        flagged: !antiFake.passed,
        trust_score: antiFake.trustScore,
      },
    },
    {
      status: 201,
      headers: rateLimitHeaders(rl),
    },
  )
}
