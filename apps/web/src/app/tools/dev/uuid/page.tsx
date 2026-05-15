'use client'

import { useState, useCallback } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Copy, Check, RefreshCw } from 'lucide-react'

function uuidv4() {
  return crypto.randomUUID()
}

function uuidv7() {
  const now = Date.now()
  const msHex = now.toString(16).padStart(12, '0')
  const rand = crypto.getRandomValues(new Uint8Array(10))
  rand[0] = (rand[0] & 0x0f) | 0x70
  rand[2] = (rand[2] & 0x3f) | 0x80
  const hex = Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${msHex.slice(0, 8)}-${msHex.slice(8, 12)}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8)}`
}

export default function UUIDPage() {
  const [version, setVersion] = useState<'v4' | 'v7'>('v4')
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState<string[]>([crypto.randomUUID()])
  const [copied, setCopied] = useState('')

  const generate = useCallback(() => {
    const gen = version === 'v4' ? uuidv4 : uuidv7
    setUuids(Array.from({ length: count }, gen))
  }, [version, count])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  const copyAll = () => copy(uuids.join('\n'))

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="UUID Generator" description="Generate random UUID v4 (random) and v7 (time-ordered) identifiers.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            {(['v4', 'v7'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${version === v ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
              >
                UUID {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Count:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button onClick={generate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700">
            <RefreshCw className="w-4 h-4" />
            Generate
          </button>
          {uuids.length > 1 && (
            <button onClick={copyAll} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <Copy className="w-4 h-4" />
              Copy All
            </button>
          )}
        </div>

        <div className="space-y-2">
          {uuids.map((uuid, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 group">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white">{uuid}</code>
              <button
                onClick={() => copy(uuid)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
              >
                {copied === uuid ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p><strong>UUID v4</strong> — completely random, 122 bits of entropy. Best for most use cases.</p>
          <p><strong>UUID v7</strong> — time-ordered (millisecond precision), sortable by creation time. Better for database primary keys.</p>
        </div>
      </div>
    </ToolPageShell>
  )
}
