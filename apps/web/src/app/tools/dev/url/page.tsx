'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

export default function URLEncodePage() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode' | 'parse'>('encode')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const process = () => {
    setError('')
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input))
      } else if (mode === 'decode') {
        setOutput(decodeURIComponent(input))
      } else {
        const url = new URL(input.startsWith('http') ? input : `https://${input}`)
        const params = Object.fromEntries(url.searchParams.entries())
        setOutput(JSON.stringify({
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          params,
        }, null, 2))
      }
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="URL Encode / Decode" description="Encode and decode URL strings, or parse a URL into its components and query parameters.">
      <div className="space-y-4">
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden w-fit">
          {(['encode', 'decode', 'parse'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Input</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={8}
              placeholder={mode === 'encode' ? 'hello world & more' : mode === 'decode' ? 'hello%20world%20%26%20more' : 'https://example.com/path?foo=bar&baz=qux'}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Output</label>
            <textarea value={output} readOnly rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button onClick={process} disabled={!input} className="px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 capitalize">
            {mode}
          </button>
          {output && (
            <button onClick={() => navigator.clipboard.writeText(output)} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              Copy
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  )
}
