'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Network, Loader2 } from 'lucide-react'

interface RDAPData {
  handle?: string
  startAddress?: string
  endAddress?: string
  name?: string
  type?: string
  country?: string
  remarks?: { title: string; description: string[] }[]
  events?: { eventAction: string; eventDate: string }[]
  entities?: unknown[]
}

export default function IPVietnamPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: RDAPData; error?: string } | null>(null)

  const lookup = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const target = query.trim()
      const isASN = /^AS\d+$/i.test(target)
      const rdapUrl = isASN
        ? `https://rdap.apnic.net/autnum/${target.replace(/^AS/i, '')}`
        : `https://rdap.apnic.net/ip/${encodeURIComponent(target)}`

      const res = await fetch(`/api/tools/vn/rdap?url=${encodeURIComponent(rdapUrl)}`)
      setResult(await res.json())
    } catch {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const d = result?.data

  return (
    <ToolPageShell groupId="vn" groupLabel="Việt Nam" groupHref="/tools/vn" groupColor="rose"
      toolLabel="IP Vietnam (APNIC/RDAP)" description="Tra cứu thông tin IP, dải IP và ASN tại Việt Nam qua APNIC RDAP.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="IP address (1.2.3.4), CIDR (1.2.0.0/16) or ASN (AS7643)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          />
          <button onClick={lookup} disabled={loading || !query.trim()} className="px-5 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
            Tra cứu
          </button>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p>Ví dụ: <button onClick={() => setQuery('1.53.0.0')} className="text-rose-500 hover:underline">1.53.0.0</button> (VNPT), <button onClick={() => setQuery('AS7643')} className="text-rose-500 hover:underline">AS7643</button> (VDC), <button onClick={() => setQuery('42.112.0.0')} className="text-rose-500 hover:underline">42.112.0.0</button> (Viettel)</p>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {result.error ? (
              <div className="p-5 text-sm text-red-600 dark:text-red-400">{result.error}</div>
            ) : d ? (
              <>
                <div className="flex items-center gap-3 px-5 py-4 bg-rose-50 dark:bg-rose-950/30">
                  <Network className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold text-rose-700 dark:text-rose-300 font-mono">{d.name ?? d.handle}</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    ['Handle', d.handle],
                    ['Name', d.name],
                    ['Type', d.type],
                    ['Country', d.country],
                    ['Start Address', d.startAddress],
                    ['End Address', d.endAddress],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex gap-4 px-5 py-2.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-36 shrink-0">{label}</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                  {d.remarks?.map((r, i) => (
                    <div key={i} className="px-5 py-2.5">
                      <div className="text-xs text-gray-400 mb-1">{r.title}</div>
                      <div className="text-sm text-gray-900 dark:text-white">{r.description.join(' ')}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
