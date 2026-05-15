'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Globe, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface DnsAnswer { name: string; type: number; TTL: number; data: string }
interface ServerResult {
  server: string; location: string; status: number; answers: DnsAnswer[]; ms: number; error: string | null
}
interface PropagationResult {
  domain: string; type: string; propagated: boolean; results: ServerResult[]
}

const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA']

function ResultCard({ r }: { r: ServerResult }) {
  const ok = !r.error && r.status === 0
  return (
    <div className={`border rounded-xl p-4 ${ok ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {ok ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
          <span className="text-sm font-semibold text-gray-800 dark:text-white">{r.server}</span>
          <span className="text-xs text-gray-400">{r.location}</span>
        </div>
        <span className="text-xs text-gray-400">{r.ms}ms</span>
      </div>
      {r.error ? (
        <p className="text-xs text-red-600 dark:text-red-400 font-mono">{r.error}</p>
      ) : r.answers.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No records (NXDOMAIN or empty)</p>
      ) : (
        <div className="space-y-1">
          {r.answers.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-10 text-blue-600 dark:text-blue-400 font-medium shrink-0">TTL</span>
              <span className="text-gray-400 w-12">{a.TTL}s</span>
              <code className="font-mono text-gray-800 dark:text-gray-200 break-all">{a.data}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DNSPropagationPage() {
  const [domain, setDomain] = useState('')
  const [type, setType] = useState('A')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PropagationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const d = domain.trim().replace(/^https?:\/\//, '').split('/')[0]
      const res = await fetch(`/api/tools/domain/propagation?domain=${encodeURIComponent(d)}&type=${type}`)
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
      toolLabel="DNS Propagation Check"
      description="Kiểm tra DNS propagation từ nhiều DNS server (Google, Cloudflare, Quad9). So sánh kết quả để phát hiện sự không đồng nhất."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DNS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Propagation status */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${result.propagated ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'}`}>
              {result.propagated
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <RefreshCw className="w-5 h-5 text-amber-600" />
              }
              <div>
                <p className={`font-semibold text-sm ${result.propagated ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {result.propagated ? 'Fully propagated — all servers agree' : 'Propagation inconsistency detected'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{result.domain} · {result.type} records</p>
              </div>
            </div>

            {/* Per-server results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.results.map(r => <ResultCard key={r.server} r={r} />)}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              DNS propagation typically takes 24–48 hours. Results reflect what each resolver has cached right now.
            </p>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
