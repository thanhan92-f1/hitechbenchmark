'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { MapPin, Loader2, Globe, Building2, Wifi } from 'lucide-react'

interface GeoData {
  query: string; country: string; countryCode: string; regionName: string
  city: string; zip: string; lat: number; lon: number
  timezone: string; isp: string; org: string; as: string; asname: string
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{value}</p>
      </div>
    </div>
  )
}

export default function IPLocationPage() {
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GeoData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lookup = async (target = ip) => {
    setLoading(true); setData(null); setError(null)
    try {
      const params = target.trim() ? `?ip=${encodeURIComponent(target)}` : ''
      const res = await fetch(`/api/tools/ip/info${params}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error ?? 'Lookup failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const mapUrl = data
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${data.lon - 0.05},${data.lat - 0.05},${data.lon + 0.05},${data.lat + 0.05}&layer=mapnik&marker=${data.lat},${data.lon}`
    : null

  const openInMaps = data
    ? `https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}&zoom=12`
    : null

  return (
    <ToolPageShell
      groupId="ip"
      groupLabel="IP & Network"
      groupHref="/tools/ip"
      groupColor="purple"
      toolLabel="IP Location Map"
      description="Hiển thị vị trí địa lý của IP address trên bản đồ. Xem thông tin ISP, thành phố, quốc gia và múi giờ."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="IP address (leave blank for your IP)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button onClick={() => lookup()} disabled={loading} className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {loading ? 'Looking up…' : 'Locate'}
          </button>
        </div>

        <button
          onClick={() => lookup('')}
          disabled={loading}
          className="text-xs text-purple-600 hover:underline"
        >
          Use my IP address
        </button>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {data && (
          <div className="space-y-4">
            {/* Map */}
            {mapUrl && (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="320"
                  style={{ border: 0 }}
                  title={`Map showing location of ${data.query}`}
                  loading="lazy"
                />
                <a
                  href={openInMaps ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 shadow-sm"
                >
                  Open in Maps ↗
                </a>
              </div>
            )}

            {/* Coordinates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Latitude', value: data.lat.toFixed(4) },
                { label: 'Longitude', value: data.lon.toFixed(4) },
                { label: 'Country', value: `${data.country} (${data.countryCode})` },
                { label: 'Timezone', value: data.timezone },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Location
                </h3>
                <InfoRow label="IP Address" value={data.query} />
                <InfoRow label="City" value={`${data.city}, ${data.regionName}`} />
                <InfoRow label="Country" value={`${data.country} (${data.countryCode})`} />
                <InfoRow label="ZIP Code" value={data.zip || '—'} />
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> Network
                </h3>
                <InfoRow label="ISP" value={data.isp} />
                <InfoRow label="Organization" value={data.org || '—'} />
                <InfoRow label="AS" value={data.as || '—'} />
                <InfoRow label="AS Name" value={data.asname || '—'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
