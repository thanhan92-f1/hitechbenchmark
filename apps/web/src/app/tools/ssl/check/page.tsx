'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { ShieldCheck, ShieldX, Loader2, ExternalLink } from 'lucide-react'

interface SSLData {
  valid: boolean
  protocol: string
  subject: Record<string, string>
  issuer: Record<string, string>
  validFrom: string
  validTo: string
  daysRemaining: number
  san: string[]
  fingerprint: string
  serialNumber: string
}

export default function SSLCheckPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; hostname?: string; data?: SSLData; error?: string } | null>(null)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/ssl/check?domain=${encodeURIComponent(domain)}`)
      setResult(await res.json())
    } catch {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const d = result?.data

  return (
    <ToolPageShell
      groupId="ssl"
      groupLabel="SSL Tools"
      groupHref="/tools/ssl"
      groupColor="green"
      toolLabel="SSL Certificate Check"
      description="Verify SSL/TLS certificate validity, expiry date, issuer and supported protocols for any domain."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="example.com or https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={check}
            disabled={loading || !domain.trim()}
            className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Status banner */}
            <div className={`flex items-center gap-3 px-5 py-4 ${d?.valid ? 'bg-green-50 dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
              {d?.valid
                ? <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                : <ShieldX className="w-6 h-6 text-red-600 dark:text-red-400" />
              }
              <div>
                <div className={`font-semibold ${d?.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {result.success && d ? (d.valid ? 'Certificate Valid' : 'Certificate Issues Detected') : 'Check Failed'}
                </div>
                {result.error && <div className="text-sm text-red-600 dark:text-red-400">{result.error}</div>}
                {d && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {result.hostname} · {d.protocol} · {d.daysRemaining > 0 ? `${d.daysRemaining} days remaining` : 'EXPIRED'}
                  </div>
                )}
              </div>
            </div>

            {d && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  ['Common Name', d.subject?.CN ?? '-'],
                  ['Organization', d.subject?.O ?? '-'],
                  ['Issuer', d.issuer?.O ?? d.issuer?.CN ?? '-'],
                  ['Valid From', d.validFrom],
                  ['Valid To', d.validTo],
                  ['Days Remaining', `${d.daysRemaining} days`],
                  ['Protocol', d.protocol],
                  ['Serial Number', d.serialNumber],
                  ['Fingerprint', d.fingerprint],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-5 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-36 shrink-0">{label}</span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono break-all">{value}</span>
                  </div>
                ))}

                {d.san.length > 0 && (
                  <div className="px-5 py-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Subject Alt Names ({d.san.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {d.san.map(name => (
                        <span key={name} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded font-mono text-gray-700 dark:text-gray-300">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Checks are performed server-side. Certificate data comes directly from a TLS handshake.
        </p>
      </div>
    </ToolPageShell>
  )
}
