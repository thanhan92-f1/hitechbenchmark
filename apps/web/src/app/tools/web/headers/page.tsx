'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Settings, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

const SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'x-xss-protection',
  'permissions-policy',
  'referrer-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
]

interface HeadersResult {
  success: boolean
  finalUrl?: string
  status?: number
  headers?: Record<string, string>
  redirects?: { url: string; status: number }[]
  error?: string
}

export default function HTTPHeadersPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HeadersResult | null>(null)
  const [showAll, setShowAll] = useState(false)

  const check = async () => {
    if (!url.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/web/headers?url=${encodeURIComponent(url)}`)
      setResult(await res.json())
    } catch {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const headers = result?.headers ?? {}
  const securityHeaders = SECURITY_HEADERS.filter(h => h in headers)
  const missingSecurityHeaders = SECURITY_HEADERS.filter(h => !(h in headers))
  const otherHeaders = Object.entries(headers).filter(([k]) => !SECURITY_HEADERS.includes(k))

  return (
    <ToolPageShell groupId="web" groupLabel="Web & SEO" groupHref="/tools/web" groupColor="red"
      toolLabel="HTTP Headers Inspector" description="Inspect HTTP response headers of any URL. Check security headers, server info, and redirect chains.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={check} disabled={loading || !url.trim()} className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Inspect
          </button>
        </div>

        {result?.success && result.finalUrl && (
          <>
            {/* Status */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <Settings className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <span className={`font-mono text-sm font-semibold mr-2 px-1.5 py-0.5 rounded ${(result.status ?? 0) < 400 ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'}`}>
                  {result.status}
                </span>
                <a href={result.finalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 inline-flex">
                  {result.finalUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Redirects */}
            {result.redirects && result.redirects.length > 1 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Redirect Chain ({result.redirects.length} steps)</p>
                <div className="space-y-1">
                  {result.redirects.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className={`font-mono px-1.5 py-0.5 rounded font-semibold ${r.status < 400 ? 'bg-blue-100 dark:bg-blue-950 text-blue-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                      <span className="font-mono truncate">{r.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Headers */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Security Headers</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {securityHeaders.map(h => (
                  <div key={h} className="flex items-start gap-3 px-4 py-2.5 bg-green-50 dark:bg-green-950/20">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-semibold text-green-700 dark:text-green-400">{h}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">{headers[h]}</div>
                    </div>
                  </div>
                ))}
                {missingSecurityHeaders.map(h => (
                  <div key={h} className="flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-950/20">
                    <span className="text-red-400 shrink-0">✗</span>
                    <span className="text-xs font-mono text-red-600 dark:text-red-400">{h}</span>
                    <span className="text-xs text-gray-400">missing</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All headers */}
            <div>
              <button onClick={() => setShowAll(v => !v)} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                All Headers ({otherHeaders.length})
              </button>
              {showAll && (
                <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                  {otherHeaders.map(([k, v]) => (
                    <div key={k} className="flex gap-3 px-4 py-2.5">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-48 shrink-0">{k}</span>
                      <span className="text-xs font-mono text-gray-900 dark:text-white break-all">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {result && !result.success && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-600 dark:text-red-400 text-sm">{result.error}</div>
        )}
      </div>
    </ToolPageShell>
  )
}
