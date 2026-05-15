'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Server, Loader2 } from 'lucide-react'

export default function NSLookupPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<{ name: string; TTL: number; data: string }[] | null>(null)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!domain.trim()) return
    setLoading(true); setAnswers(null); setError('')
    try {
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(domain)}&type=NS`)
      const json = await res.json()
      if (json.success) setAnswers(json.answers ?? [])
      else setError(json.error ?? 'Lookup failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="NS Lookup" description="Find the authoritative name servers (NS records) responsible for a domain.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={lookup} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Lookup
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {answers && (
          answers.length === 0
            ? <div className="p-4 text-center text-sm text-gray-500">No NS records found</div>
            : <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {answers.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <Server className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm font-mono text-gray-900 dark:text-white flex-1">{a.data.replace(/\.$/, '')}</span>
                    <span className="text-xs text-gray-400">TTL {a.TTL}s</span>
                  </div>
                ))}
              </div>
        )}
      </div>
    </ToolPageShell>
  )
}
