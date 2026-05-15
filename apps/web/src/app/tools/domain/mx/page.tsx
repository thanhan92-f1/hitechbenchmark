'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Mail, Loader2 } from 'lucide-react'

interface DnsAnswer { name: string; type: number; TTL: number; data: string }

export default function MXCheckPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<DnsAnswer[] | null>(null)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setAnswers(null)
    setError('')
    try {
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(domain)}&type=MX`)
      const json = await res.json()
      if (json.success) setAnswers(json.answers ?? [])
      else setError(json.error ?? 'Lookup failed')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const parsed = answers?.map(a => {
    const parts = a.data.split(' ')
    return { priority: parts[0], host: parts[1]?.replace(/\.$/, ''), ttl: a.TTL }
  }).sort((a, b) => parseInt(a.priority) - parseInt(b.priority))

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="MX Check" description="Look up mail server (MX) records for any domain to verify email routing configuration.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={lookup} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Check
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {parsed && (
          parsed.length === 0
            ? <div className="p-4 text-center text-sm text-gray-500">No MX records found for {domain}</div>
            : <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-5 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{domain} — {parsed.length} mail server{parsed.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {parsed.map((r, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 w-12 shrink-0">P:{r.priority}</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white flex-1">{r.host}</span>
                      <span className="text-xs text-gray-400">TTL {r.ttl}s</span>
                    </div>
                  ))}
                </div>
              </div>
        )}
      </div>
    </ToolPageShell>
  )
}
