'use client'

import { useState, useCallback, useTransition } from 'react'
import { Search, SlidersHorizontal, Server } from 'lucide-react'
import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard'
import { Card, CardBody } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useSearchParams, useRouter } from 'next/navigation'

const VIRTUALIZATIONS = [
  { value: '', label: 'All Types' },
  { value: 'kvm', label: 'KVM' },
  { value: 'xen', label: 'Xen' },
  { value: 'openvz', label: 'OpenVZ' },
  { value: 'lxc', label: 'LXC' },
  { value: 'none', label: 'Dedicated' },
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

export default function SearchPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const [q, setQ] = useState(sp.get('q') || '')
  const [virtualization, setVirtualization] = useState(sp.get('virtualization') || '')
  const [sortBy, setSortBy] = useState(sp.get('sort_by') || 'createdAt')
  const [results, setResults] = useState<Benchmark[]>([])
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number; hasNext: boolean } | null>(null)
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  const doSearch = useCallback(async (
    query: string,
    virt: string,
    sort: string,
    page = 1,
  ) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (virt) params.set('virtualization', virt)
    params.set('sort_by', sort)
    params.set('page', String(page))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(q, virtualization, sortBy)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search Benchmarks</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Search by hostname, CPU model, IP address, city, ISP, or organization.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6">
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

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters:</span>
          </div>
          <select
            value={virtualization}
            onChange={(e) => { setVirtualization(e.target.value); doSearch(q, e.target.value, sortBy) }}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            {VIRTUALIZATIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); doSearch(q, virtualization, e.target.value) }}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
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
                  onClick={() => doSearch(q, virtualization, sortBy, meta.page - 1)}
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
                  onClick={() => doSearch(q, virtualization, sortBy, meta.page + 1)}
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
          <p className="text-gray-400 dark:text-gray-600">Enter a keyword to start searching</p>
        </div>
      )}
    </div>
  )
}
