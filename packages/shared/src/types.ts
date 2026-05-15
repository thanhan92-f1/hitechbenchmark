// Shared TypeScript types for HiTech Benchmark

// ============================================================
// API Response types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============================================================
// Benchmark payload types (from bash script)
// ============================================================

export interface BenchmarkPayload {
  benchmark_type: 'public' | 'private'
  client_version: string
  timestamp: number
  nonce: string
  signature: string
  system: SystemInfo
  network: NetworkInfo
  disk_results: DiskBenchmarkResult[]
  cpu_results: CpuBenchmarkResult
  memory_results: MemoryBenchmarkResult
  network_results: NetworkBenchmarkResult[]
  security: SecurityInfo
}

export interface SystemInfo {
  hostname: string
  os_name: string
  os_version: string
  kernel: string
  architecture: string
  virtualization: string
  cpu_model: string
  cpu_cores: number
  cpu_threads: number
  cpu_frequency_mhz: number
  ram_total_mb: number
  swap_total_mb: number
  disk_total_gb: number
  uptime_seconds: number
  load_average: string
}

export interface NetworkInfo {
  ipv4: string
  ipv6?: string
  asn?: number
  isp?: string
  organization?: string
  reverse_dns?: string
  city?: string
  region?: string
  country_code?: string
  datacenter?: string
}

export interface DiskBenchmarkResult {
  device: string
  dd_write_mbps?: number
  dd_read_mbps?: number
  fio_read_iops?: number
  fio_write_iops?: number
  fio_read_mbps?: number
  fio_write_mbps?: number
  fio_read_latency_ms?: number
  fio_write_latency_ms?: number
}

export interface CpuBenchmarkResult {
  sysbench_single_score?: number
  sysbench_multi_score?: number
  compression_score?: number
  events_per_second?: number
}

export interface MemoryBenchmarkResult {
  read_speed_mbps?: number
  write_speed_mbps?: number
  latency_ns?: number
}

export interface NetworkBenchmarkResult {
  location: string
  server_host: string
  download_mbps?: number
  upload_mbps?: number
  ping_ms?: number
  jitter_ms?: number
}

export interface SecurityInfo {
  open_ports?: number[]
  firewall_detected?: boolean
  kernel_hardening?: Record<string, boolean>
  virtualization_type?: string
  cloud_provider?: string
  selinux?: boolean
  apparmor?: boolean
}

// ============================================================
// Frontend display types
// ============================================================

export interface BenchmarkSummary {
  id: string
  uuid: string
  hostname?: string
  osName?: string
  cpuModel?: string
  cpuCores?: number
  ramTotalMb?: number
  virtualization?: string
  ipv4?: string
  city?: string
  region?: string
  country?: CountrySummary
  provider?: ProviderSummary
  totalScore?: number
  visibility: 'public' | 'private'
  status: string
  createdAt: string
}

export interface BenchmarkDetail extends BenchmarkSummary {
  osVersion?: string
  kernel?: string
  architecture?: string
  cpuThreads?: number
  cpuFrequencyMhz?: number
  swapTotalMb?: number
  diskTotalGb?: number
  uptimeSeconds?: number
  loadAverage?: string
  ipv6?: string
  reverseDns?: string
  isp?: string
  organization?: string
  asn?: AsnSummary
  results: BenchmarkResultItem[]
  scores?: BenchmarkScoreDetail
  locations: BenchmarkLocationItem[]
  trustScore: number
}

export interface BenchmarkResultItem {
  category: string
  metricName: string
  metricValue: number
  unit?: string
  metadata?: Record<string, unknown>
}

export interface BenchmarkScoreDetail {
  cpuScore?: number
  diskScore?: number
  memoryScore?: number
  networkScore?: number
  securityScore?: number
  totalScore?: number
  rankSnapshot?: number
  scoreVersion: string
}

export interface BenchmarkLocationItem {
  testLocation: string
  downloadMbps?: number
  uploadMbps?: number
  pingMs?: number
  jitterMs?: number
}

export interface ProviderSummary {
  id: string
  name: string
  slug: string
  logoUrl?: string
  websiteUrl?: string
  avgScore?: number
  benchmarkCount: number
  country?: CountrySummary
}

export interface ProviderDetail extends ProviderSummary {
  uptimeRating?: number
  asn?: AsnSummary
  topBenchmarks: BenchmarkSummary[]
}

export interface CountrySummary {
  code: string
  name: string
  flagEmoji?: string
  region?: string
}

export interface AsnSummary {
  asnNumber: number
  name: string
  organization?: string
}

export interface StatisticsOverview {
  totalBenchmarks: number
  todayBenchmarks: number
  totalProviders: number
  publicBenchmarks: number
  privateBenchmarks: number
  topCountries: Array<{ country: CountrySummary; count: number }>
  topProviders: Array<{ provider: ProviderSummary; count: number }>
}

export interface RankingEntry {
  rank: number
  benchmark: BenchmarkSummary
  totalScore: number
}

export interface CompareData {
  benchmarks: BenchmarkDetail[]
  metrics: CompareMetric[]
}

export interface CompareMetric {
  name: string
  category: string
  unit: string
  values: Array<{ benchmarkId: string; value: number | null }>
}

// ============================================================
// Filter types
// ============================================================

export interface BenchmarkFilters {
  country?: string
  provider?: string
  asn?: string
  cpuModel?: string
  ramMin?: number
  ramMax?: number
  virtualization?: string
  hasIpv6?: boolean
  page?: number
  perPage?: number
  sortBy?: 'createdAt' | 'totalScore' | 'cpuCores' | 'ramTotalMb'
  sortOrder?: 'asc' | 'desc'
}
