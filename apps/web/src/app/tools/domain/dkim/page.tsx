'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { KeyRound, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function DKIMCheckPage() {
  const [domain, setDomain] = useState('')
  const [selector, setSelector] = useState('default')
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<string | null>(null)
  const [error, setError] = useState('')

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setRecord(null); setError('')
    try {
      const dkimDomain = `${selector}._domainkey.${domain}`
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(dkimDomain)}&type=TXT`)
      const json = await res.json()
      const dkim = json.answers?.find((a: { data: string }) => a.data.includes('v=DKIM1') || a.data.includes('k=rsa') || a.data.includes('p='))
      if (dkim) setRecord(dkim.data)
      else setError(`No DKIM record found at ${selector}._domainkey.${domain}`)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const parsed = record ? Object.fromEntries(
    record.split(';').map(p => p.trim().split('=')).filter(p => p.length === 2)
  ) : null

  const COMMON_SELECTORS = ['default', 'google', 'k1', 'mail', 's1', 's2', 'selector1', 'selector2', 'dkim', 'email']

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="DKIM Check" description="Verify DKIM (DomainKeys Identified Mail) public key records for email signing authentication.">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-2">
          <input type="text" value={selector} onChange={e => setSelector(e.target.value)}
            placeholder="Selector (e.g. default)"
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          <input type="text" value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="example.com"
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 justify-center">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Check
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 self-center">Common selectors:</span>
          {COMMON_SELECTORS.map(s => (
            <button key={s} onClick={() => setSelector(s)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${selector === s ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300'}`}>
              {s}
            </button>
          ))}
        </div>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm text-red-600">{error}</span></div>}

        {record && parsed && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-green-700 dark:text-green-400 mb-1 font-medium">{selector}._domainkey.{domain}</div>
                <code className="text-xs font-mono text-green-800 dark:text-green-200 break-all">{record}</code>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {[
                ['Version (v)', parsed.v ?? '-'],
                ['Key Type (k)', parsed.k ?? 'rsa'],
                ['Hash Algorithm (h)', parsed.h ?? 'sha256'],
                ['Public Key (p)', parsed.p ? `${parsed.p.slice(0, 40)}…` : '-'],
                ['Notes (n)', parsed.n ?? '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-5 py-2.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-40 shrink-0">{label}</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
