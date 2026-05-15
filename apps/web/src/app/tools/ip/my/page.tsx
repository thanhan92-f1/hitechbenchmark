'use client'

import { useEffect, useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { MapPin, Loader2, Copy, Check } from 'lucide-react'

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

export default function MyIPPage() {
  const [data, setData] = useState<IPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/tools/ip/info')
      .then(r => r.json())
      .then(j => {
        if (j.success) setData(j.data)
        else setError(j.error ?? 'Failed')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  const copy = () => {
    if (data?.query) {
      navigator.clipboard.writeText(data.query)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <ToolPageShell groupId="ip" groupLabel="IP & Network" groupHref="/tools/ip" groupColor="purple"
      toolLabel="My IP Address" description="Detect your current public IP address with geolocation and network details.">
      {loading ? (
        <div className="flex items-center gap-3 p-6 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Detecting your IP address…
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>
      ) : data ? (
        <div className="space-y-4">
          {/* Big IP display */}
          <div className="flex items-center gap-3 p-5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="flex-1">
              <div className="text-3xl font-bold font-mono text-purple-700 dark:text-purple-300">{data.query}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{data.city}, {data.regionName}, {data.country}</div>
            </div>
            <button onClick={copy} className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {[
              ['IP Address', data.query],
              ['Country', `${data.country} (${data.countryCode})`],
              ['Region', data.regionName],
              ['City', data.city],
              ['ZIP', data.zip || '-'],
              ['Coordinates', `${data.lat}, ${data.lon}`],
              ['Timezone', data.timezone],
              ['ISP', data.isp],
              ['Organization', data.org || '-'],
              ['ASN', data.as],
              ['AS Name', data.asname],
              ['Reverse DNS', data.reverse || '-'],
              ['Mobile', data.mobile ? 'Yes' : 'No'],
              ['Proxy / VPN', data.proxy ? '⚠ Yes' : 'No'],
              ['Hosting / DC', data.hosting ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-5 py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-36 shrink-0">{label}</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  )
}
