'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { BarChart, Loader2 } from 'lucide-react'

export default function ASNLookupPage() {
  const [asn, setAsn] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!asn.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const asnNum = asn.trim().replace(/^AS/i, '')
      const rdapUrl = `https://rdap.apnic.net/autnum/${encodeURIComponent(asnNum)}`
      const res = await fetch(`/api/tools/vn/rdap?url=${encodeURIComponent(rdapUrl)}`)
      const json = await res.json()
      if (json.success) setResult(json.data)
      else setError(json.error ?? 'Lookup failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const d = result as {
    handle?: string; name?: string; type?: string; country?: string;
    startAutnum?: number; endAutnum?: number;
    remarks?: { title: string; description: string[] }[]
    events?: { eventAction: string; eventDate: string }[]
  } | null

  return (
    <ToolPageShell groupId="ip" groupLabel="IP & Network" groupHref="/tools/ip" groupColor="purple"
      toolLabel="ASN Lookup" description="Look up Autonomous System Number (ASN) information including name, country and registered IP ranges.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={asn} onChange={e => setAsn(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="AS7643 or 7643"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          <button onClick={lookup} disabled={loading || !asn.trim()} className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Lookup
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {[['AS7643', 'VDC (VNPT)'], ['AS7552', 'Viettel'], ['AS45899', 'VNPT-I'], ['AS18403', 'FPT'], ['AS38731', 'CMC']].map(([a, label]) => (
            <button key={a} onClick={() => { setAsn(a); lookup() }}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-purple-300 hover:text-purple-600">
              {a} <span className="text-gray-400">({label})</span>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {d && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 dark:bg-purple-950/30">
              <BarChart className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-purple-700 dark:text-purple-300 font-mono">{d.handle} — {d.name}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                ['Handle', d.handle],
                ['Name', d.name],
                ['Type', d.type],
                ['Country', d.country],
                ['Start ASN', d.startAutnum?.toString()],
                ['End ASN', d.endAutnum?.toString()],
                ['Registered', d.events?.find(e => e.eventAction === 'registration')?.eventDate],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex gap-4 px-5 py-2.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0">{label}</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
