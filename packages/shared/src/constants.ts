// Shared constants for HiTech Benchmark

export const SCORING_WEIGHTS = {
  cpu: 0.30,
  disk: 0.25,
  network: 0.25,
  memory: 0.15,
  security: 0.05,
} as const

export const SCORE_VERSION = 'v1'

export const BENCHMARK_CATEGORIES = ['disk', 'cpu', 'memory', 'network', 'security'] as const

// Network test locations
export const NETWORK_TEST_LOCATIONS = [
  { name: 'Vietnam (Ho Chi Minh)', host: 'speedtest.fpt.vn', location: 'VN-HCM' },
  { name: 'Vietnam (Ha Noi)', host: 'speedtest.viettel.vn', location: 'VN-HAN' },
  { name: 'Singapore', host: 'sgp-ping.vultr.com', location: 'SG' },
  { name: 'Japan (Tokyo)', host: 'hnd-jp-ping.vultr.com', location: 'JP-TYO' },
  { name: 'USA (Los Angeles)', host: 'lax-ca-us-ping.vultr.com', location: 'US-LA' },
  { name: 'USA (New York)', host: 'nj-us-ping.vultr.com', location: 'US-NY' },
  { name: 'Europe (Frankfurt)', host: 'fra-de-ping.vultr.com', location: 'DE-FRA' },
] as const

// Anti-fake thresholds
export const ANTI_FAKE_LIMITS = {
  maxNetworkGbps: 100,
  maxIops: 3_000_000,
  maxDiskWriteMbps: 20_000,
  maxRamGb: 4096,
  maxCpuCores: 512,
  minTimestampDeltaSeconds: -300,
  maxTimestampDeltaSeconds: 300,
} as const

export const PAYLOAD_MAX_BYTES = 524_288 // 512KB

export const NONCE_TTL_SECONDS = 600 // 10 minutes

export const PRIVATE_TOKEN_BYTES = 32

export const BENCHMARK_SLUG_LENGTH = 8

export const SCORE_MAX = 100

export const VIRTUALIZATION_TYPES = [
  'kvm',
  'xen',
  'openvz',
  'lxc',
  'docker',
  'vmware',
  'hyper-v',
  'none',
  'unknown',
] as const

export const SUPPORTED_OS = [
  'ubuntu',
  'debian',
  'centos',
  'almalinux',
  'rocky',
  'fedora',
  'arch',
] as const

export const CLIENT_SCRIPT_VERSION = '1.0.0'

export const API_VERSION = 'v1'
