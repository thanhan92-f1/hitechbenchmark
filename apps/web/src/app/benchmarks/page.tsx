import { Suspense } from 'react'
import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard'
import { Card, CardBody } from '@/components/ui/Card'
import { Server } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recent Benchmarks',
  description: 'Latest VPS benchmark results from around the world.',
}

export const dynamic = 'force-dynamic'

async function getBenchmarks(searchParams: Record<string, string>) {
  const params = new URLSearchParams(searchParams)
  if (!params.has('per_page')) params.set('per_page', '20')

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/benchmarks?${params.toString()}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return { data: [], meta: null }
    return await res.json()
  } catch {
    return { data: [], meta: null }
  }
}

export default async function BenchmarksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const { data: benchmarks, meta } = await getBenchmarks(params)

  const page = parseInt(params.page || '1')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recent Benchmarks</h1>
        {meta && (
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Showing {benchmarks.length} of {meta.total.toLocaleString()} public benchmark results
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          defaultValue={params.virtualization || ''}
        >
          <option value="">All Virtualization</option>
          <option value="kvm">KVM</option>
          <option value="xen">Xen</option>
          <option value="openvz">OpenVZ</option>
          <option value="lxc">LXC</option>
          <option value="none">Dedicated</option>
        </select>
        <select
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          defaultValue={params.sort_by || 'createdAt'}
        >
          <option value="createdAt">Latest First</option>
          <option value="totalScore">Highest Score</option>
        </select>
      </div>

      {/* Results */}
      {benchmarks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {benchmarks.map((b: Parameters<typeof BenchmarkCard>[0]['benchmark']) => (
              <BenchmarkCard key={b.uuid} benchmark={b} />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <a
                  href={`/benchmarks?page=${page - 1}`}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous
                </a>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              {meta.hasNext && (
                <a
                  href={`/benchmarks?page=${page + 1}`}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <Server className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No benchmarks yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to benchmark your VPS!
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
