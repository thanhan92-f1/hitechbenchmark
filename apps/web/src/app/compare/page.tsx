'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { GitCompare, Plus, X } from 'lucide-react'
import { formatMbps, formatScore, getScoreColor, cn } from '@/lib/utils'

export default function ComparePage() {
  const [uuids, setUuids] = useState<string[]>(['', ''])
  const [compareData, setCompareData] = useState<{
    benchmarks: Record<string, string>[];
    metrics: { category: string; metricName: string; values: { benchmarkId: string; value: number | null }[] }[];
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addUuid = () => {
    if (uuids.length < 5) setUuids([...uuids, ''])
  }

  const removeUuid = (i: number) => {
    setUuids(uuids.filter((_, idx) => idx !== i))
  }

  const handleCompare = async () => {
    const filtered = uuids.filter(Boolean)
    if (filtered.length < 2) {
      setError('Enter at least 2 benchmark UUIDs')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/compare?benchmark_ids=${filtered.join(',')}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setCompareData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comparison')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compare Benchmarks</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Enter 2-5 benchmark UUIDs to compare side by side
        </p>
      </div>

      {/* Input */}
      <Card className="mb-8">
        <CardBody>
          <div className="space-y-3 mb-4">
            {uuids.map((uuid, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={uuid}
                  onChange={(e) => {
                    const next = [...uuids]
                    next[i] = e.target.value
                    setUuids(next)
                  }}
                  placeholder={`Benchmark UUID ${i + 1}`}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono placeholder-gray-400"
                />
                {uuids.length > 2 && (
                  <button
                    onClick={() => removeUuid(i)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {uuids.length < 5 && (
              <button
                onClick={addUuid}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add another
              </button>
            )}
            <button
              onClick={handleCompare}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              {loading ? 'Comparing…' : 'Compare'}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </CardBody>
      </Card>

      {/* Results */}
      {compareData && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 bg-gray-50 dark:bg-gray-800 font-medium text-gray-500 dark:text-gray-400 w-48 rounded-l-lg">
                  Metric
                </th>
                {compareData.benchmarks.map((b) => (
                  <th key={b.uuid as string} className="text-center py-3 px-4 bg-gray-50 dark:bg-gray-800 font-medium text-gray-900 dark:text-white last:rounded-r-lg">
                    <div>{(b.hostname as string) || (b.uuid as string)?.slice(0, 8) + '…'}</div>
                    <div className="text-xs text-gray-400 font-normal">{b.cpuModel as string}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {compareData.metrics.slice(0, 30).map((metric) => (
                <tr key={metric.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400">
                    <div className="text-xs text-gray-400 capitalize">{metric.category}</div>
                    <div>{metric.metricName}</div>
                  </td>
                  {metric.values.map((v) => {
                    // Find max value for highlighting
                    const max = Math.max(...metric.values.map((x) => x.value ?? 0))
                    const isMax = v.value != null && v.value === max && max > 0
                    return (
                      <td
                        key={v.benchmarkId}
                        className={cn(
                          'py-2.5 px-4 text-center font-mono',
                          isMax ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-900 dark:text-white',
                        )}
                      >
                        {v.value != null ? v.value.toLocaleString() : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
