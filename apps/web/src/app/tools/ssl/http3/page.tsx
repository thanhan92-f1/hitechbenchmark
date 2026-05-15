'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Zap, ZapOff, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface H3Result {
  supported: boolean
  quic: boolean
  altSvc: string | null
  server: string | null
  protocols: string[]
  httpStatus: number
}

export default function HTTP3Page() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<H3Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!url.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch(`/api/tools/web/headers?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (!json.success) { setError(json.error ?? 'Failed'); return }

      const headers = json.headers as Record<string, string>
      const altSvc = headers['alt-svc'] ?? null
      const server = headers['server'] ?? null

      // Detect H3/QUIC from alt-svc header
      const protocols: string[] = []
      if (altSvc) {
        const h3Match = altSvc.match(/h3[-=]?\d*/g)
        const h3dash = altSvc.match(/h3-\d+/g)
        if (h3Match) protocols.push(...h3Match.map(p => p.replace('=', '')))
        if (h3dash) protocols.push(...h3dash)
        if (altSvc.includes('quic')) protocols.push('quic')
      }
      const deduped = [...new Set(protocols)]
      const supported = deduped.some(p => p.startsWith('h3') || p === 'quic')
      const quic = deduped.some(p => p === 'quic' || p === 'h3')

      setResult({ supported, quic, altSvc, server, protocols: deduped, httpStatus: json.status ?? 200 })
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="ssl"
      groupLabel="SSL Tools"
      groupHref="/tools/ssl"
      groupColor="green"
      toolLabel="HTTP/3 / QUIC Check"
      description="Kiểm tra hỗ trợ HTTP/3 và QUIC protocol thông qua Alt-Svc headers. HTTP/3 chạy trên QUIC thay vì TCP."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={check} disabled={loading || !url.trim()} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${result.supported ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}`}>
              {result.supported
                ? <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                : <ZapOff className="w-6 h-6 text-gray-500" />
              }
              <div>
                <p className={`font-semibold ${result.supported ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  HTTP/3 {result.supported ? 'Supported' : 'Not detected'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {result.protocols.length > 0 ? `Protocols: ${result.protocols.join(', ')}` : 'No QUIC/H3 advertised in Alt-Svc'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'HTTP/3 (H3)', ok: result.supported },
                { label: 'QUIC', ok: result.quic },
              ].map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-2 p-3 rounded-lg border ${ok ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}`}>
                  {ok ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                </div>
              ))}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Relevant Headers</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { name: 'Alt-Svc', value: result.altSvc },
                  { name: 'Server', value: result.server },
                ].map(({ name, value }) => (
                  <div key={name} className="grid grid-cols-[120px_1fr] px-4 py-2.5">
                    <span className="text-xs font-medium text-gray-500">{name}</span>
                    <span className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all">{value ?? <span className="text-gray-400 italic">not set</span>}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              HTTP/3 detection uses Alt-Svc response headers. A server may support HTTP/3 on a different port (usually 443 UDP) even if your current request used HTTP/1.1 or HTTP/2.
            </p>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
