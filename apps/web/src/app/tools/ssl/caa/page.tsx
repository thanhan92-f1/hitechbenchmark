'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

interface CaaAnswer { name: string; type: number; TTL: number; data: string }

const TAG_DESCRIPTIONS: Record<string, string> = {
  issue: 'Authorizes a CA to issue standard DV/OV/EV certificates',
  issuewild: 'Authorizes a CA to issue wildcard certificates',
  iodef: 'URL for reporting policy violations (email or HTTPS)',
  issuevmc: 'Authorizes a CA to issue Verified Mark Certificates',
}

function parseCaaData(data: string) {
  const m = data.match(/(\d+)\s+(\S+)\s+"?([^"]*)"?/)
  if (!m) return { flags: 0, tag: data, value: '' }
  return { flags: +m[1], tag: m[2].toLowerCase(), value: m[3] }
}

export default function CAAPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<CaaAnswer[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setRecords(null); setError(null)
    try {
      const d = domain.trim().replace(/^https?:\/\//, '').split('/')[0]
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(d)}&type=CAA`)
      const json = await res.json()
      if (json.success) setRecords(json.answers)
      else setError(json.error ?? 'Lookup failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="ssl"
      groupLabel="SSL Tools"
      groupHref="/tools/ssl"
      groupColor="green"
      toolLabel="CAA Record Check"
      description="Kiểm tra DNS CAA (Certification Authority Authorization) records để xem CA nào được phép cấp chứng chỉ SSL."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {records !== null && (
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">No CAA records found</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Without CAA records, any Certificate Authority can issue certificates for this domain.
                    Adding CAA records is a security best practice.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{records.length} CAA record{records.length !== 1 ? 's' : ''} found</span>
                </div>

                <div className="space-y-3">
                  {records.map((rec, i) => {
                    const { flags, tag, value } = parseCaaData(rec.data)
                    return (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <code className="text-sm font-mono font-semibold text-gray-800 dark:text-white">{rec.data}</code>
                          <span className="text-xs text-gray-400">TTL: {rec.TTL}s</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-1">
                          <div>
                            <p className="text-xs text-gray-500">Flags</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{flags}{flags === 128 && <span className="ml-1 text-xs text-amber-600">(critical)</span>}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Tag</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white font-mono">{tag}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Value</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate font-mono">{value || '(any)'}</p>
                          </div>
                        </div>
                        {TAG_DESCRIPTIONS[tag] && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-2">{TAG_DESCRIPTIONS[tag]}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">What is a CAA record?</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                CAA (Certification Authority Authorization) DNS records restrict which CAs can issue SSL/TLS certificates for a domain.
                CAs must check these records before issuing. Example: <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">0 issue &quot;letsencrypt.org&quot;</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
