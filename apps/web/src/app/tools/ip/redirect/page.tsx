'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Link2, Loader2, ArrowRight, CheckCircle } from 'lucide-react'

interface Redirect { url: string; status: number }

export default function RedirectCheckerPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirects, setRedirects] = useState<Redirect[]>([])
  const [finalStatus, setFinalStatus] = useState<number | null>(null)
  const [error, setError] = useState('')

  const check = async () => {
    if (!url.trim()) return
    setLoading(true); setRedirects([]); setError(''); setFinalStatus(null)
    try {
      const res = await fetch(`/api/tools/web/headers?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.success) {
        setRedirects(json.redirects ?? [])
        setFinalStatus(json.status)
      } else {
        setError(json.error ?? 'Failed')
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const statusColor = (s: number) =>
    s < 300 ? 'text-green-600 bg-green-100 dark:bg-green-950' :
    s < 400 ? 'text-blue-600 bg-blue-100 dark:bg-blue-950' :
    'text-red-600 bg-red-100 dark:bg-red-950'

  return (
    <ToolPageShell groupId="ip" groupLabel="IP & Network" groupHref="/tools/ip" groupColor="purple"
      toolLabel="Redirect Checker" description="Trace the full redirect chain of any URL. See all HTTP 301/302 redirects step by step.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={check} disabled={loading || !url.trim()} className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Trace
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {redirects.length > 0 && (
          <div className="space-y-2">
            {redirects.map((r, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  {i === redirects.length - 1 && finalStatus && finalStatus < 400
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <span className="w-4 h-4 shrink-0 text-center text-xs text-gray-400 font-bold">{i + 1}</span>
                  }
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${statusColor(r.status)}`}>
                    {r.status}
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white truncate flex-1">{r.url}</span>
                </div>
                {i < redirects.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center">{redirects.length} hop{redirects.length !== 1 ? 's' : ''} total</p>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
