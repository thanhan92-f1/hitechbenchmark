'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Cpu, Loader2, Building2, CheckCircle, XCircle } from 'lucide-react'

interface MacResult {
  mac: string; oui: string; vendor: string | null; found: boolean
}

const EXAMPLES = ['00:1A:2B:3C:4D:5E', 'DC:A6:32:00:00:01', 'F4:5C:89:AB:CD:EF', '00-50-56-AA-BB-CC']

export default function MACLookupPage() {
  const [mac, setMac] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MacResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async (input = mac) => {
    if (!input.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch(`/api/tools/ip/mac?mac=${encodeURIComponent(input)}`)
      const json = await res.json()
      if (json.success) setResult(json)
      else setError(json.error ?? 'Lookup failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="ip"
      groupLabel="IP & Network"
      groupHref="/tools/ip"
      groupColor="purple"
      toolLabel="MAC Address Lookup"
      description="Tra cứu thông tin nhà sản xuất (vendor) từ địa chỉ MAC. Hỗ trợ định dạng XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={mac}
            onChange={e => setMac(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="00:1A:2B:3C:4D:5E"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button onClick={() => check()} disabled={loading || !mac.trim()} className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            {loading ? 'Looking up…' : 'Lookup'}
          </button>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => { setMac(ex); check(ex) }}
              className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {ex}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${result.found ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}`}>
              {result.found
                ? <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-0.5" />
                : <XCircle className="w-6 h-6 text-gray-400 mt-0.5" />
              }
              <div>
                {result.found ? (
                  <>
                    <p className="font-semibold text-purple-700 dark:text-purple-300 text-lg">{result.vendor}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Vendor for OUI prefix</p>
                  </>
                ) : (
                  <p className="font-medium text-gray-600 dark:text-gray-400">Unknown vendor — OUI not in database</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Normalized MAC</p>
                <code className="text-sm font-mono font-semibold text-gray-800 dark:text-white">{result.mac}</code>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">OUI Prefix (first 3 bytes)</p>
                <code className="text-sm font-mono font-semibold text-gray-800 dark:text-white">{result.oui.match(/.{2}/g)!.join(':')}</code>
              </div>
            </div>

            {result.found && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>The OUI (Organizationally Unique Identifier) identifies the manufacturer. The remaining 3 bytes are device-specific and assigned by the vendor.</span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Vendor data via macvendors.com. Accepts XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, or plain hex (XXXXXXXXXXXX).
        </p>
      </div>
    </ToolPageShell>
  )
}
