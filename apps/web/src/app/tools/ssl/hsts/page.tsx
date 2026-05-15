'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Lock, Unlock, Loader2 } from 'lucide-react'

export default function HSTSCheckPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    enabled?: boolean
    header?: string
    maxAge?: number
    includeSubdomains?: boolean
    preload?: boolean
    error?: string
  } | null>(null)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`
      const res = await fetch(`/api/tools/web/headers?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.success) {
        const hsts = json.headers?.['strict-transport-security'] ?? null
        if (hsts) {
          const maxAgeMatch = hsts.match(/max-age=(\d+)/i)
          setResult({
            enabled: true,
            header: hsts,
            maxAge: maxAgeMatch ? parseInt(maxAgeMatch[1]) : undefined,
            includeSubdomains: /includeSubDomains/i.test(hsts),
            preload: /preload/i.test(hsts),
          })
        } else {
          setResult({ enabled: false })
        }
      } else {
        setResult({ error: json.error })
      }
    } catch {
      setResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPageShell
      groupId="ssl"
      groupLabel="SSL Tools"
      groupHref="/tools/ssl"
      groupColor="green"
      toolLabel="HSTS Check"
      description="Verify if a website has HTTP Strict Transport Security (HSTS) enabled and check its configuration."
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
          <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Check
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className={`flex items-center gap-3 px-5 py-4 ${result.enabled ? 'bg-green-50 dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
              {result.enabled ? <Lock className="w-6 h-6 text-green-600" /> : <Unlock className="w-6 h-6 text-red-600" />}
              <div>
                <p className={`font-semibold ${result.enabled ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  HSTS {result.enabled ? 'Enabled' : result.error ? 'Check Failed' : 'Not Enabled'}
                </p>
                {result.error && <p className="text-sm text-red-500">{result.error}</p>}
              </div>
            </div>
            {result.enabled && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {result.header && (
                  <div className="px-5 py-3">
                    <div className="text-xs text-gray-400 mb-1">Header value</div>
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{result.header}</code>
                  </div>
                )}
                {[
                  ['Max Age', result.maxAge ? `${result.maxAge.toLocaleString()} seconds (${Math.floor(result.maxAge / 86400)} days)` : '-'],
                  ['Include Subdomains', result.includeSubdomains ? '✓ Yes' : '✗ No'],
                  ['Preload', result.preload ? '✓ Yes' : '✗ No'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-4 px-5 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-40">{k}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
