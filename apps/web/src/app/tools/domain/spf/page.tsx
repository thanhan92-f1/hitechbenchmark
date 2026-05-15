'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

function parseSpf(record: string) {
  const parts = record.split(/\s+/)
  const mechanisms = parts.filter(p => !p.startsWith('v='))
  const includes = mechanisms.filter(m => m.startsWith('include:')).map(m => m.slice(8))
  const ips = mechanisms.filter(m => m.startsWith('ip4:') || m.startsWith('ip6:')).map(m => m)
  const all = mechanisms.find(m => /^[~?+-]all$/.test(m))

  let allPolicy = 'Unknown'
  if (all?.startsWith('-')) allPolicy = 'Fail (strict)'
  else if (all?.startsWith('~')) allPolicy = 'SoftFail (allow but mark)'
  else if (all?.startsWith('?')) allPolicy = 'Neutral (no policy)'
  else if (all?.startsWith('+')) allPolicy = 'Pass (anything allowed)'

  return { mechanisms, includes, ips, all, allPolicy }
}

export default function SPFCheckPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<string | null>(null)
  const [error, setError] = useState('')

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setRecord(null); setError('')
    try {
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(domain)}&type=TXT`)
      const json = await res.json()
      const spf = json.answers?.find((a: { data: string }) => a.data.startsWith('v=spf1'))
      if (spf) setRecord(spf.data)
      else setError('No SPF record found')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const parsed = record ? parseSpf(record) : null

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="SPF Check" description="Look up and analyze SPF (Sender Policy Framework) records to verify email authentication configuration.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Check
          </button>
        </div>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm text-red-600">{error}</span></div>}

        {record && parsed && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <code className="text-xs font-mono text-green-800 dark:text-green-200 break-all">{record}</code>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3">
                {parsed.allPolicy.includes('Fail') ? <XCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0">All policy</span>
                <span className={`text-sm font-medium ${parsed.allPolicy.includes('Fail (strict)') ? 'text-green-600' : 'text-yellow-600'}`}>{parsed.allPolicy}</span>
              </div>
              {parsed.includes.length > 0 && (
                <div className="px-5 py-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Included domains ({parsed.includes.length})</div>
                  {parsed.includes.map(inc => <div key={inc} className="text-sm font-mono text-gray-900 dark:text-white">{inc}</div>)}
                </div>
              )}
              {parsed.ips.length > 0 && (
                <div className="px-5 py-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">IP ranges</div>
                  {parsed.ips.map(ip => <div key={ip} className="text-sm font-mono text-gray-900 dark:text-white">{ip}</div>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
