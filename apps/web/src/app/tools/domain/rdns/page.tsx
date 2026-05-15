'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Network, Loader2 } from 'lucide-react'

export default function ReverseDNSPage() {
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [hostname, setHostname] = useState<string | null>(null)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!ip.trim()) return
    setLoading(true); setHostname(null); setError('')
    try {
      // Convert IP to PTR format
      const parts = ip.trim().split('.')
      if (parts.length !== 4) { setError('Please enter a valid IPv4 address'); setLoading(false); return }
      const ptrName = parts.reverse().join('.') + '.in-addr.arpa'
      const res = await fetch(`/api/tools/domain/dns?domain=${encodeURIComponent(ptrName)}&type=PTR`)
      const json = await res.json()
      if (json.answers?.length > 0) {
        setHostname(json.answers[0].data.replace(/\.$/, ''))
      } else {
        setError(`No PTR record found for ${ip}`)
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell groupId="domain" groupLabel="Domain & DNS" groupHref="/tools/domain" groupColor="blue"
      toolLabel="Reverse DNS" description="Find the hostname (PTR record) associated with an IP address using reverse DNS lookup.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={ip} onChange={e => setIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="1.1.1.1"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          <button onClick={lookup} disabled={loading || !ip.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Lookup
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {hostname && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Network className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <div className="text-xs text-gray-400 mb-0.5">{ip} resolves to</div>
              <div className="text-lg font-mono font-semibold text-gray-900 dark:text-white">{hostname}</div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
