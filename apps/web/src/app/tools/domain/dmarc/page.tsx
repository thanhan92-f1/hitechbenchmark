'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

function parseDmarc(record: string) {
  const tags: Record<string, string> = {}
  record.split(';').forEach(part => {
    const [k, v] = part.trim().split('=')
    if (k && v) tags[k.trim()] = v.trim()
  })

  const policyMap: Record<string, string> = { none: 'Monitor only (no action)', quarantine: 'Quarantine (spam folder)', reject: 'Reject email' }
  const alignMap: Record<string, string> = { r: 'Relaxed', s: 'Strict' }
  const pctNum = parseInt(tags['pct'] ?? '100')

  return {
    policy: tags['p'],
    policyDesc: policyMap[tags['p'] ?? ''] ?? tags['p'],
    subdomainPolicy: tags['sp'] ?? tags['p'],
    rua: tags['rua'],
    ruf: tags['ruf'],
    aspf: alignMap[tags['aspf'] ?? 'r'] ?? 'Relaxed',
    adkim: alignMap[tags['adkim'] ?? 'r'] ?? 'Relaxed',
    pct: pctNum,
    tags,
  }
}

export default function DMARCCheckPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<string | null>(null)
  const [error, setError] = useState('')

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setRecord(null); setError('')
    try {
      const dmarcDomain = `_dmarc.${domain.replace(/^_dmarc\./, '')}`
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(dmarcDomain)}&type=TXT`)
      const json = await res.json()
      const dmarc = json.answers?.find((a: { data: string }) => a.data.startsWith('v=DMARC1'))
      if (dmarc) setRecord(dmarc.data)
      else setError('No DMARC record found at _dmarc.' + domain)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const parsed = record ? parseDmarc(record) : null

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="DMARC Check" description="Analyze DMARC (Domain-based Message Authentication) records for email policy and reporting settings.">
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
              {[
                ['Policy', `${parsed.policy?.toUpperCase()} — ${parsed.policyDesc}`],
                ['Subdomain Policy', parsed.subdomainPolicy?.toUpperCase() ?? 'Inherit from p='],
                ['Coverage', `${parsed.pct}% of emails`],
                ['DKIM Alignment', parsed.adkim],
                ['SPF Alignment', parsed.aspf],
                ['Aggregate Reports (rua)', parsed.rua ?? '—'],
                ['Failure Reports (ruf)', parsed.ruf ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-5 py-2.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-40 shrink-0">{label}</span>
                  <span className={`text-sm ${label === 'Policy' && parsed.policy === 'reject' ? 'text-green-600 font-semibold' : label === 'Policy' && parsed.policy === 'none' ? 'text-yellow-600 font-semibold' : 'text-gray-900 dark:text-white'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
