'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { RefreshCw } from 'lucide-react'

function fmtDate(d: Date) {
  return {
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: d.toString(),
    date: d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('vi-VN'),
    unix: Math.floor(d.getTime() / 1000),
    unixMs: d.getTime(),
  }
}

export default function TimestampPage() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ReturnType<typeof fmtDate> | null>(null)
  const [error, setError] = useState('')

  const convert = (val = input) => {
    setError('')
    setResult(null)
    const trimmed = val.trim()
    if (!trimmed) { setResult(fmtDate(new Date())); return }
    try {
      // Try as unix timestamp first
      if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed)
        const ms = trimmed.length >= 13 ? num : num * 1000
        const d = new Date(ms)
        if (isNaN(d.getTime())) throw new Error('Invalid timestamp')
        setResult(fmtDate(d))
        return
      }
      // Try as date string
      const d = new Date(trimmed)
      if (isNaN(d.getTime())) throw new Error('Could not parse date')
      setResult(fmtDate(d))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const now = () => {
    const d = new Date()
    setInput(Math.floor(d.getTime() / 1000).toString())
    setResult(fmtDate(d))
    setError('')
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Unix Timestamp Converter" description="Convert Unix timestamps to human-readable dates and vice versa.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && convert()}
            placeholder="Unix timestamp (e.g. 1700000000) or date string"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
          />
          <button onClick={now} className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800" title="Use current time">
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button onClick={() => convert()} className="px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700">
            Convert
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {[
              ['Unix Timestamp', result.unix.toString()],
              ['Unix (ms)', result.unixMs.toString()],
              ['ISO 8601', result.iso],
              ['UTC', result.utc],
              ['Local Date (VN)', result.date],
              ['Local Time', result.time],
              ['Full Local', result.local],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-5 py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-40 shrink-0">{label}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(value)}
                  className="text-sm font-mono text-gray-900 dark:text-white text-left hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  title="Click to copy"
                >
                  {value}
                </button>
              </div>
            ))}
          </div>
        )}

        {!result && (
          <p className="text-xs text-gray-400">Leave empty and click Convert to see the current timestamp. Click any value to copy it.</p>
        )}
      </div>
    </ToolPageShell>
  )
}
