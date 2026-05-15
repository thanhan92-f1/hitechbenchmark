'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

export default function Base64Page() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [urlSafe, setUrlSafe] = useState(false)

  const process = () => {
    setError('')
    try {
      if (mode === 'encode') {
        let encoded = btoa(unescape(encodeURIComponent(input)))
        if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        setOutput(encoded)
      } else {
        let decoded = input
        if (urlSafe) decoded = decoded.replace(/-/g, '+').replace(/_/g, '/')
        while (decoded.length % 4 !== 0) decoded += '='
        setOutput(decodeURIComponent(escape(atob(decoded))))
      }
    } catch {
      setError(mode === 'decode' ? 'Invalid Base64 string' : 'Encoding failed')
      setOutput('')
    }
  }

  const swap = () => {
    setInput(output)
    setOutput('')
    setMode(m => m === 'encode' ? 'decode' : 'encode')
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Base64 Encode / Decode" description="Encode text to Base64 or decode Base64 back to text. Supports UTF-8 and URL-safe variants.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            {(['encode', 'decode'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>
                {m}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={urlSafe} onChange={e => setUrlSafe(e.target.checked)} className="rounded" />
            URL-safe (no +/= chars)
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {mode === 'encode' ? 'Plain text' : 'Base64 string'}
            </label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={8}
              placeholder={mode === 'encode' ? 'Enter text to encode…' : 'Enter Base64 to decode…'}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {mode === 'encode' ? 'Base64 output' : 'Decoded text'}
            </label>
            <textarea value={output} readOnly rows={8}
              placeholder="Output will appear here…"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button onClick={process} className="px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700">
            {mode === 'encode' ? 'Encode' : 'Decode'}
          </button>
          <button onClick={swap} disabled={!output} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            ⇄ Swap
          </button>
          <button onClick={() => output && navigator.clipboard.writeText(output)} disabled={!output} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            Copy Output
          </button>
        </div>
      </div>
    </ToolPageShell>
  )
}
