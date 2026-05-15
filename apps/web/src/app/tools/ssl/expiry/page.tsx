'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Clock, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

export default function SSLExpiryPage() {
  const [domains, setDomains] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<{ domain: string; days?: number; expires?: string; error?: string }>>([])

  const check = async () => {
    const list = domains.split('\n').map(d => d.trim()).filter(Boolean)
    if (!list.length) return
    setLoading(true)
    setResults([])
    const out = await Promise.all(list.map(async domain => {
      try {
        const res = await fetch(`/api/tools/ssl/check?domain=${encodeURIComponent(domain)}`)
        const json = await res.json()
        if (json.success && json.data) {
          return { domain, days: json.data.daysRemaining, expires: json.data.validTo }
        }
        return { domain, error: json.error ?? 'Failed' }
      } catch {
        return { domain, error: 'Network error' }
      }
    }))
    setResults(out)
    setLoading(false)
  }

  return (
    <ToolPageShell groupId="ssl" groupLabel="SSL Tools" groupHref="/tools/ssl" groupColor="green"
      toolLabel="SSL Expiry Monitor" description="Check SSL certificate expiration for multiple domains at once.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Domains (one per line)
          </label>
          <textarea
            value={domains}
            onChange={e => setDomains(e.target.value)}
            rows={5}
            placeholder="example.com&#10;another.com&#10;api.example.com"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
        <button onClick={check} disabled={loading || !domains.trim()} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Checking…' : 'Check All'}
        </button>

        {results.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {results.map(r => {
              const ok = r.days !== undefined && r.days > 0
              const warn = r.days !== undefined && r.days <= 30
              return (
                <div key={r.domain} className="flex items-center gap-4 px-5 py-3">
                  {r.error
                    ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    : ok && !warn
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                  }
                  <span className="text-sm font-mono text-gray-900 dark:text-white w-48 shrink-0">{r.domain}</span>
                  {r.error
                    ? <span className="text-sm text-red-500">{r.error}</span>
                    : <>
                        <span className={`text-sm font-semibold ${r.days! <= 0 ? 'text-red-600' : r.days! <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {r.days! <= 0 ? 'EXPIRED' : `${r.days} days`}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{r.expires}</span>
                      </>
                  }
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
