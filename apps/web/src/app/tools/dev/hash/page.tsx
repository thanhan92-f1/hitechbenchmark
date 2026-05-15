'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Copy, Check } from 'lucide-react'

type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

async function digest(algo: Algorithm, text: string) {
  const data = new TextEncoder().encode(text)
  const hashBuf = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function HashPage() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<Partial<Record<Algorithm, string>>>({})
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')

  const generate = async () => {
    if (!input) return
    setLoading(true)
    const algos: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
    const results: Partial<Record<Algorithm, string>> = {}
    await Promise.all(algos.map(async a => { results[a] = await digest(a, input) }))
    setHashes(results)
    setLoading(false)
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Hash Generator" description="Generate cryptographic hashes (SHA-1, SHA-256, SHA-384, SHA-512) for any text. Runs entirely in your browser.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Input text</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={4}
            placeholder="Enter text to hash…"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
        </div>

        <button onClick={generate} disabled={loading || !input} className="px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50">
          {loading ? 'Generating…' : 'Generate Hashes'}
        </button>

        {Object.entries(hashes).length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {(Object.entries(hashes) as [Algorithm, string][]).map(([algo, hash]) => (
              <div key={algo} className="px-4 py-3 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{algo}</span>
                  <button onClick={() => copy(hash)} className="p-1 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied === hash ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{hash}</code>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400">Hashing is performed client-side using the Web Crypto API. Input never leaves your browser.</p>
      </div>
    </ToolPageShell>
  )
}
