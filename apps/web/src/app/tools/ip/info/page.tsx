'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Network, Loader2 } from 'lucide-react'

interface IPData {
  query: string
  country: string
  countryCode: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
  asname: string
  reverse: string
  mobile: boolean
  proxy: boolean
  hosting: boolean
}

export default function IPInfoPage() {
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: IPData; error?: string } | null>(null)

  const lookup = async () => {
    setLoading(true)
    setResult(null)
    try {
      const query = ip.trim() ? `?ip=${encodeURIComponent(ip.trim())}` : ''
      const res = await fetch(`/api/tools/ip/info${query}`)
      setResult(await res.json())
    } catch {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const d = result?.data

  return (
    <ToolPageShell groupId="ip" groupLabel="IP & Network" groupHref="/tools/ip" groupColor="purple"
      toolLabel="IP Lookup" description="Get detailed information about any IPv4 or IPv6 address — location, ISP, ASN, and more.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="8.8.8.8 (leave empty for your IP)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={lookup} disabled={loading} className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Looking up…' : 'Lookup'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900">
              <Network className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-purple-700 dark:text-purple-300 font-mono">
                {d?.query ?? 'Lookup Failed'}
              </span>
              {result.error && <span className="text-sm text-red-500">{result.error}</span>}
            </div>
            {d && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  ['IP Address', d.query],
                  ['Country', `${d.country} (${d.countryCode})`],
                  ['Region', d.regionName],
                  ['City', d.city],
                  ['ZIP Code', d.zip || '-'],
                  ['Coordinates', `${d.lat}, ${d.lon}`],
                  ['Timezone', d.timezone],
                  ['ISP', d.isp],
                  ['Organization', d.org || '-'],
                  ['ASN', d.as],
                  ['AS Name', d.asname],
                  ['Reverse DNS', d.reverse || '-'],
                  ['Connection Type', [d.hosting && 'Hosting/DC', d.proxy && 'Proxy/VPN', d.mobile && 'Mobile'].filter(Boolean).join(', ') || 'Residential'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-5 py-2.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-36 shrink-0">{label}</span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400">Powered by ip-api.com. For commercial use, please check their licensing terms.</p>
      </div>
    </ToolPageShell>
  )
}
