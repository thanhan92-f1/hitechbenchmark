'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { FileSearch, Loader2 } from 'lucide-react'

export default function TXTLookupPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<{ data: string; TTL: number }[] | null>(null)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!domain.trim()) return
    setLoading(true); setAnswers(null); setError('')
    try {
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(domain)}&type=TXT`)
      const json = await res.json()
      if (json.success) setAnswers(json.answers ?? [])
      else setError(json.error ?? 'Lookup failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const categorize = (txt: string) => {
    if (txt.includes('v=spf1')) return 'SPF'
    if (txt.includes('v=DMARC1')) return 'DMARC'
    if (txt.includes('google-site-verification')) return 'Google'
    if (txt.includes('MS=')) return 'Microsoft'
    if (txt.includes('v=DKIM1')) return 'DKIM'
    if (txt.startsWith('_')) return 'Verification'
    return 'TXT'
  }

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="TXT Record Lookup" description="View all TXT DNS records including SPF, DMARC, DKIM and domain verification tokens.">
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
            ? <div className="p-4 text-center text-sm text-gray-500">No TXT records found</div>
            : <div className="space-y-2">
                {answers.map((a, i) => {
                  const cat = categorize(a.data)
                  return (
                    <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">{cat}</span>
                        <span className="text-xs text-gray-400">TTL {a.TTL}s</span>
                      </div>
                      <code className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all whitespace-pre-wrap">{a.data}</code>
                    </div>
                  )
                })}
              </div>
        )}
      </div>
    </ToolPageShell>
  )
}
