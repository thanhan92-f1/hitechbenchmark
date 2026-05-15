'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export default function HTTP2CheckPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ protocol?: string; supported?: boolean; error?: string } | null>(null)

  const check = async () => {
    if (!url.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/web/headers?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.success) {
        // Next.js fetch will upgrade to HTTP/2 automatically; check response headers
        const proto = json.headers?.['x-protocol'] ?? json.headers?.['alt-svc'] ?? null
        const supported = !!(json.headers?.['x-firefox-spdy'] || proto?.includes('h2') || json.headers?.['alt-svc']?.includes('h2'))
        setResult({ protocol: proto ?? 'Unknown', supported })
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
      toolLabel="HTTP/2 Check"
      description="Check if a web server supports the HTTP/2 protocol for faster, multiplexed connections."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={check} disabled={loading || !url.trim()} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>
        {result && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${result.supported ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40'}`}>
            {result.supported
              ? <Wifi className="w-6 h-6 text-green-600 dark:text-green-400" />
              : <WifiOff className="w-6 h-6 text-red-600 dark:text-red-400" />
            }
            <div>
              {result.error
                ? <p className="text-red-600 dark:text-red-400 text-sm">{result.error}</p>
                : <>
                    <p className={`font-semibold ${result.supported ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      HTTP/2 {result.supported ? 'Supported' : 'Not detected'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{result.protocol}</p>
                  </>
              }
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Detection is based on Alt-Svc headers. For definitive results, use browser developer tools (Network tab → Protocol column).
        </p>
      </div>
    </ToolPageShell>
  )
}
