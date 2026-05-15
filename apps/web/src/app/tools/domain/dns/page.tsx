'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Server, Loader2 } from 'lucide-react'

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'PTR', 'SRV', 'CAA']

interface DnsAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

const TYPE_NAMES: Record<number, string> = {
  1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 12: 'PTR',
  15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 257: 'CAA',
}

export default function DNSRecordsPage() {
  const [domain, setDomain] = useState('')
  const [type, setType] = useState('A')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; domain?: string; type?: string; answers?: DnsAnswer[]; error?: string } | null>(null)

  const lookup = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(domain)}&type=${type}`)
      setResult(await res.json())
    } catch {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="DNS Records Lookup" description="Query DNS records of any type for any domain. Powered by Google DNS-over-HTTPS.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={lookup} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Lookup
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900">
              <Server className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {result.domain} — {result.type} Records
              </span>
              {!result.success && <span className="text-sm text-red-500">{result.error}</span>}
            </div>

            {result.success && result.answers && result.answers.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-gray-500">No {type} records found for {domain}</div>
            )}

            {result.success && result.answers && result.answers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {['Name', 'Type', 'TTL', 'Value'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {result.answers.map((a, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-mono text-gray-900 dark:text-white text-xs">{a.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            {TYPE_NAMES[a.type] ?? a.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{a.TTL}s</td>
                        <td className="px-4 py-2.5 font-mono text-gray-900 dark:text-white text-xs break-all">{a.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
