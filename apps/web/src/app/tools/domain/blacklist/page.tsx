'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Shield, ShieldAlert, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface DnsblCheck {
  name: string; host: string; description: string
  listed: boolean; returnCode: string | null; reason: string | null
}
interface BlacklistResult {
  query: string; ip: string; listedCount: number; totalChecked: number; checks: DnsblCheck[]
}

export default function BlacklistCheckPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BlacklistResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!query.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch(`/api/tools/domain/blacklist?ip=${encodeURIComponent(query)}`)
      const json = await res.json()
      if (json.success) setResult(json)
      else setError(json.error ?? 'Check failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="domain"
      groupLabel="Domain & DNS"
      groupHref="/tools/domain"
      groupColor="blue"
      toolLabel="Blacklist Check"
      description="Kiểm tra IP hoặc domain có bị liệt vào danh sách đen spam (DNSBL) không. Kiểm tra nhiều blacklist cùng lúc."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="IP address or domain (e.g. 1.2.3.4 or mail.example.com)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={check} disabled={loading || !query.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${result.listedCount === 0 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40'}`}>
              {result.listedCount === 0
                ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                : <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
              }
              <div>
                <p className={`font-semibold ${result.listedCount === 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {result.listedCount === 0
                    ? 'Clean — not listed on any blacklist'
                    : `Listed on ${result.listedCount} of ${result.totalChecked} blacklists`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Query: {result.query} {result.ip !== result.query && `→ ${result.ip}`}
                </p>
              </div>
            </div>

            {/* Score bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Reputation score</span>
                <span>{result.totalChecked - result.listedCount}/{result.totalChecked} clean</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${result.listedCount === 0 ? 'bg-green-500' : result.listedCount <= 2 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${((result.totalChecked - result.listedCount) / result.totalChecked) * 100}%` }}
                />
              </div>
            </div>

            {/* DNSBL results */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500">
                <span>Blacklist</span><span>Status</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {result.checks.map(c => (
                  <div key={c.host} className="grid grid-cols-[1fr_auto] items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.description}</p>
                      {c.reason && <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-mono">{c.reason.slice(0, 100)}</p>}
                    </div>
                    <div className="ml-4">
                      {c.listed
                        ? <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 dark:bg-red-950/50 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" />Listed</span>
                        : <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-950/50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" />Clean</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
