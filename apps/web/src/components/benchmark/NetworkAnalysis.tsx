'use client'

import { useEffect, useState } from 'react'
import { Wifi, TrendingUp, TrendingDown, Activity, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NetworkQuality {
  overallScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  avgDownloadMbps: number | null
  avgUploadMbps: number | null
  avgPingMs: number | null
  avgJitterMs: number | null
  bestLocation: string | null
  worstLocation: string | null
  consistency: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  asnInfo: { asNumber: number | null; name: string | null; organization: string | null }
}

const GRADE_META = {
  A: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800' },
  B: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' },
  C: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800' },
  D: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800' },
  F: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' },
}

function StatCard({ label, value, unit, icon: Icon }: { label: string; value: string | null; unit: string; icon?: React.ElementType }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />}
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
        {value != null ? `${value} ${unit}` : '—'}
      </div>
    </div>
  )
}

export function NetworkAnalysis({ uuid }: { uuid: string }) {
  const [data, setData] = useState<NetworkQuality | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/benchmarks/${uuid}/network-analysis`)
      .then(r => r.json())
      .then(j => { if (j.success) setData(j.data) })
      .finally(() => setLoading(false))
  }, [uuid])

  if (loading) return (
    <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
      <Activity className="w-4 h-4 animate-pulse" /> Analyzing network quality…
    </div>
  )
  if (!data) return null

  const gm = GRADE_META[data.grade]

  return (
    <div className="space-y-4">
      {/* Grade + summary */}
      <div className={cn('flex items-center gap-4 p-4 rounded-xl border', gm.bg, gm.border)}>
        <div className={cn('text-4xl font-bold font-mono w-12 text-center', gm.color)}>{data.grade}</div>
        <div>
          <div className={cn('font-semibold text-sm', gm.color)}>Network Score: {data.overallScore}/100</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{data.summary}</p>
        </div>
        <div className="ml-auto text-right text-xs text-gray-400">
          <div>Consistency</div>
          <div className="font-mono font-semibold text-gray-700 dark:text-gray-300">{data.consistency}%</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Avg Download" value={data.avgDownloadMbps?.toFixed(0) ?? null} unit="Mbps" icon={TrendingUp} />
        <StatCard label="Avg Upload" value={data.avgUploadMbps?.toFixed(0) ?? null} unit="Mbps" icon={TrendingDown} />
        <StatCard label="Avg Ping" value={data.avgPingMs?.toFixed(0) ?? null} unit="ms" icon={Activity} />
        <StatCard label="Avg Jitter" value={data.avgJitterMs?.toFixed(1) ?? null} unit="ms" icon={Wifi} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Strengths */}
        {data.strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Strengths</h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Weaknesses */}
        {data.weaknesses.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Issues</h4>
            <ul className="space-y-1">
              {data.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className="text-orange-500 mt-0.5">!</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ASN info */}
      {data.asnInfo.asNumber && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
          <Award className="w-3.5 h-3.5" />
          <span>AS{data.asnInfo.asNumber}</span>
          {data.asnInfo.name && <span>— {data.asnInfo.name}</span>}
          {data.asnInfo.organization && <span className="text-gray-400">({data.asnInfo.organization})</span>}
        </div>
      )}

      {data.bestLocation && (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Best: <span className="font-medium text-green-600 dark:text-green-400">{data.bestLocation}</span>
          {data.worstLocation && data.worstLocation !== data.bestLocation && (
            <> · Worst: <span className="font-medium text-orange-500">{data.worstLocation}</span></>
          )}
        </div>
      )}
    </div>
  )
}
