'use client'

import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2, ToggleLeft, ToggleRight, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { formatScore, formatDate, getScoreColor, cn } from '@/lib/utils'

interface MonitoringResult {
  id: string
  totalScore: number | null
  cpuScore: number | null
  diskScore: number | null
  networkScore: number | null
  scoreChange: number | null
  createdAt: string
}

interface MonitoredServer {
  id: string
  nickname: string | null
  hostname: string | null
  interval: string
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
  results: MonitoringResult[]
}

const INTERVAL_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
}

export default function MonitoringPage() {
  const [servers, setServers] = useState<MonitoredServer[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ nickname: '', hostname: '', interval: 'weekly' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/me/monitoring')
      const json = await res.json()
      if (json.success) setServers(json.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const addServer = async () => {
    setError('')
    const res = await fetch('/api/me/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (json.success) {
      setAdding(false)
      setForm({ nickname: '', hostname: '', interval: 'weekly' })
      load()
    } else {
      setError(json.message || 'Failed to add server')
    }
  }

  const removeServer = async (id: string) => {
    if (!confirm('Remove this monitored server?')) return
    await fetch(`/api/me/monitoring/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/me/monitoring/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Historical Monitoring
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track VPS performance over time with scheduled benchmarks
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Server
        </button>
      </div>

      {/* Add server form */}
      {adding && (
        <div className="mb-6 p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">Add Monitored Server</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nickname (optional)"
              value={form.nickname}
              onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Hostname / IP (optional)"
              value={form.hostname}
              onChange={e => setForm(f => ({ ...f, hostname: e.target.value }))}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={form.interval}
              onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={addServer} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add</button>
            <button onClick={() => { setAdding(false); setError('') }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : servers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No monitored servers yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add a server to track its performance over time</p>
        </div>
      ) : (
        <div className="space-y-6">
          {servers.map(server => (
            <div key={server.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              {/* Server header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {server.nickname || server.hostname || `Server ${server.id.slice(0, 8)}`}
                    </span>
                    <span className={cn('px-2 py-0.5 text-xs rounded-full', server.isActive
                      ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
                      {server.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {INTERVAL_LABELS[server.interval]}
                    </span>
                    {server.nextRunAt && (
                      <span>Next: {formatDate(server.nextRunAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(server.id, server.isActive)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    {server.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => removeServer(server.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results history */}
              {server.results.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  No benchmark results yet. The first run will happen on the next scheduled time.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <th className="px-5 py-2.5 font-medium">Date</th>
                        <th className="px-3 py-2.5 font-medium text-right">Total</th>
                        <th className="px-3 py-2.5 font-medium text-right">CPU</th>
                        <th className="px-3 py-2.5 font-medium text-right">Disk</th>
                        <th className="px-3 py-2.5 font-medium text-right">Net</th>
                        <th className="px-3 py-2.5 font-medium text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {server.results.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400">{formatDate(r.createdAt)}</td>
                          <td className={cn('px-3 py-2.5 text-right font-mono font-semibold', getScoreColor(r.totalScore ?? 0))}>
                            {r.totalScore != null ? formatScore(r.totalScore) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">
                            {r.cpuScore != null ? formatScore(r.cpuScore) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">
                            {r.diskScore != null ? formatScore(r.diskScore) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">
                            {r.networkScore != null ? formatScore(r.networkScore) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {r.scoreChange == null ? (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            ) : r.scoreChange > 1 ? (
                              <span className="text-green-600 flex items-center justify-end gap-0.5">
                                <TrendingUp className="w-3 h-3" />+{r.scoreChange.toFixed(1)}
                              </span>
                            ) : r.scoreChange < -1 ? (
                              <span className="text-red-500 flex items-center justify-end gap-0.5">
                                <TrendingDown className="w-3 h-3" />{r.scoreChange.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400 flex items-center justify-end gap-0.5">
                                <Minus className="w-3 h-3" />{r.scoreChange.toFixed(1)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">How it works</p>
        <p>When a benchmark is submitted with your API token, it is automatically linked to your monitored server. The system tracks score changes over time and alerts you if performance drops significantly.</p>
        <p className="mt-2">Maximum 5 monitored servers per account.</p>
      </div>
    </div>
  )
}
