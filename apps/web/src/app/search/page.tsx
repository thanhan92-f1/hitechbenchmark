'use client'

import { Suspense, useState, useCallback, useTransition } from 'react'
import { Search, SlidersHorizontal, Server, ChevronDown, ChevronUp } from 'lucide-react'
import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard'
import { Card, CardBody } from '@/components/ui/Card'
import { useSearchParams, useRouter } from 'next/navigation'

const VIRTUALIZATIONS = [
  { value: '', label: 'All Types' },
  { value: 'kvm', label: 'KVM' },
  { value: 'xen', label: 'Xen' },
  { value: 'openvz', label: 'OpenVZ' },
  { value: 'lxc', label: 'LXC' },
  { value: 'none', label: 'Dedicated' },
]

const CPU_TYPES = [
  { value: '', label: 'All CPUs' },
  { value: 'intel', label: 'Intel' },
  { value: 'amd', label: 'AMD' },
  { value: 'arm', label: 'ARM' },
]

const RAM_OPTIONS = [
  { value: '', label: 'Any RAM' },
  { value: '512', label: '512 MB+' },
  { value: '1024', label: '1 GB+' },
  { value: '2048', label: '2 GB+' },
  { value: '4096', label: '4 GB+' },
  { value: '8192', label: '8 GB+' },
  { value: '16384', label: '16 GB+' },
  { value: '32768', label: '32 GB+' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Latest First' },
  { value: 'totalScore', label: 'Highest Score' },
]

interface Benchmark {
  uuid: string
  hostname?: string
  osName?: string
  cpuModel?: string
  cpuCores?: number
  ramTotalMb?: number
  virtualization?: string
  ipv4?: string
  city?: string
  publicSlug?: string
  createdAt: string
  totalScore?: number | null
  country?: { code: string; name: string; flagEmoji: string }
  provider?: { name: string; slug: string }
}

function SearchContent() {
  const router = useRouter()
  const sp = useSearchParams()

  const [q, setQ] = useState(sp.get('q') || '')
  const [virtualization, setVirtualization] = useState(sp.get('virtualization') || '')
  const [cpuType, setCpuType] = useState(sp.get('cpu_type') || '')
  const [minRam, setMinRam] = useState(sp.get('min_ram') || '')
  const [minCores, setMinCores] = useState(sp.get('min_cores') || '')
  const [maxCores, setMaxCores] = useState(sp.get('max_cores') || '')
  const [minScore, setMinScore] = useState(sp.get('min_score') || '')
  const [maxScore, setMaxScore] = useState(sp.get('max_score') || '')
  const [sortBy, setSortBy] = useState(sp.get('sort_by') || 'createdAt')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [results, setResults] = useState<Benchmark[]>([])
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number; hasNext: boolean } | null>(null)
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  const doSearch = useCallback(async (opts: {
    query?: string; virt?: string; cpuType?: string; minRam?: string
    minCores?: string; maxCores?: string; minScore?: string; maxScore?: string
    sort?: string; page?: number
  }) => {
    const params = new URLSearchParams()
    if (opts.query) params.set('q', opts.query)
    if (opts.virt) params.set('virtualization', opts.virt)
    if (opts.cpuType) params.set('cpu_type', opts.cpuType)
    if (opts.minRam) params.set('min_ram', opts.minRam)
    if (opts.minCores) params.set('min_cores', opts.minCores)
    if (opts.maxCores) params.set('max_cores', opts.maxCores)
    if (opts.minScore) params.set('min_score', opts.minScore)
    if (opts.maxScore) params.set('max_score', opts.maxScore)
    params.set('sort_by', opts.sort || 'createdAt')
    params.set('page', String(opts.page || 1))
    params.set('per_page', '18')

    router.replace(`/search?${params.toString()}`, { scroll: false })

    startTransition(async () => {
      try {
        const res = await fetch(`/api/benchmarks?${params.toString()}`)
        const json = await res.json()
        setResults(json.data || [])
        setMeta(json.meta || null)
        setSearched(true)
      } catch {
        setResults([])
        setSearched(true)
      }
    })
  }, [router])

  const getOpts = (overrides: Record<string, string> = {}) => ({
    query: q, virt: virtualization, cpuType, minRam, minCores, maxCores, minScore, maxScore, sort: sortBy,
    ...overrides,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(getOpts())
  }

  const handleFilterChange = (key: string, value: string) => {
    const updates: Record<string, string> = { [key]: value }
    if (key === 'virt') setVirtualization(value)
    else if (key === 'cpuType') setCpuType(value)
    else if (key === 'minRam') setMinRam(value)
    else if (key === 'minCores') setMinCores(value)
    else if (key === 'maxCores') setMaxCores(value)
    else if (key === 'minScore') setMinScore(value)
    else if (key === 'maxScore') setMaxScore(value)
    else if (key === 'sort') setSortBy(value)
    doSearch(getOpts(updates))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search Benchmarks</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Search by hostname, CPU model, IP address, city, ISP, or organization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hostname, CPU, IP, ISP…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {isPending ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <select
            value={virtualization}
            onChange={(e) => handleFilterChange('virt', e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            {VIRTUALIZATIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <select
            value={cpuType}
            onChange={(e) => handleFilterChange('cpuType', e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            {CPU_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAdvanced(a => !a)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Advanced {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min RAM</label>
              <select
                value={minRam}
                onChange={(e) => handleFilterChange('minRam', e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              >
                {RAM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min vCPU</label>
              <input
                type="number"
                min="1"
                value={minCores}
                onChange={(e) => handleFilterChange('minCores', e.target.value)}
                placeholder="e.g. 2"
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max vCPU</label>
              <input
                type="number"
                min="1"
                value={maxCores}
                onChange={(e) => handleFilterChange('maxCores', e.target.value)}
                placeholder="e.g. 32"
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => handleFilterChange('minScore', e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={maxScore}
                onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                placeholder="e.g. 90"
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
        )}
      </form>

      {/* Results */}
      {isPending && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">Searching…</div>
      )}

      {!isPending && searched && results.length === 0 && (
        <Card>
          <CardBody className="text-center py-16">
            <Server className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try a different keyword or remove filters.
            </p>
          </CardBody>
        </Card>
      )}

      {!isPending && results.length > 0 && (
        <>
          {meta && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {meta.total.toLocaleString()} result{meta.total !== 1 ? 's' : ''} found
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((b) => (
              <BenchmarkCard key={b.uuid} benchmark={b} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {meta.page > 1 && (
                <button
                  onClick={() => doSearch(getOpts({ page: String(meta.page - 1) }))}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous
                </button>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              {meta.hasNext && (
                <button
                  onClick={() => doSearch(getOpts({ page: String(meta.page + 1) }))}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </>
      )}

      {!isPending && !searched && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
          <p className="text-gray-400 dark:text-gray-600">Enter a keyword or select filters to start searching</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-500 dark:text-gray-400">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  )
}
