'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Globe, Loader2 } from 'lucide-react'

interface WhoisData {
  domainName: string
  status: string[]
  created: string | null
  updated: string | null
  expires: string | null
  registrar: string | null
  registrant: string | null
  nameservers: string[]
  handle: string | null
}

export default function WhoisPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: WhoisData; error?: string } | null>(null)

  const lookup = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/domain/whois?domain=${encodeURIComponent(domain)}`)
      setResult(await res.json())
    } catch {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const d = result?.data

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="Whois / RDAP Lookup" description="Get domain registration details including registrar, dates, name servers and registration status via RDAP.">
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
          <button onClick={lookup} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Looking up…' : 'Lookup'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-blue-50 dark:bg-blue-950/30">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                {result.success && d ? d.domainName : 'Lookup Failed'}
              </span>
              {result.error && <span className="text-sm text-red-500">{result.error}</span>}
            </div>

            {d && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  ['Registrar', d.registrar ?? '-'],
                  ['Registrant', d.registrant ?? 'Redacted'],
                  ['Handle', d.handle ?? '-'],
                  ['Created', d.created ? new Date(d.created).toLocaleDateString() : '-'],
                  ['Updated', d.updated ? new Date(d.updated).toLocaleDateString() : '-'],
                  ['Expires', d.expires ? new Date(d.expires).toLocaleDateString() : '-'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-5 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-32 shrink-0">{label}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}

                {d.status.length > 0 && (
                  <div className="px-5 py-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status</div>
                    <div className="flex flex-wrap gap-1.5">
                      {d.status.map(s => (
                        <span key={s} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded font-mono">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {d.nameservers.length > 0 && (
                  <div className="px-5 py-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Name Servers</div>
                    <div className="space-y-1">
                      {d.nameservers.map(ns => (
                        <div key={ns} className="text-sm font-mono text-gray-900 dark:text-white">{ns}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400">Data sourced from RDAP (rdap.org). Some registrars may redact registrant details per GDPR.</p>
      </div>
    </ToolPageShell>
  )
}
