'use client'

import { useState, useCallback } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { RefreshCw, Copy, Check } from 'lucide-react'

const CHARS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

function generate(length: number, opts: Record<string, boolean>) {
  const pool = Object.entries(opts).filter(([, v]) => v).map(([k]) => CHARS[k as keyof typeof CHARS]).join('')
  if (!pool) return ''
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(n => pool[n % pool.length]).join('')
}

function strength(pwd: string) {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (pwd.length >= 16) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 2) return { label: 'Weak', color: 'bg-red-500' }
  if (score <= 4) return { label: 'Fair', color: 'bg-yellow-500' }
  if (score <= 5) return { label: 'Good', color: 'bg-blue-500' }
  return { label: 'Strong', color: 'bg-green-500' }
}

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16)
  const [opts, setOpts] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true })
  const [passwords, setPasswords] = useState<string[]>([generate(16, { uppercase: true, lowercase: true, numbers: true, symbols: true })])
  const [count, setCount] = useState(1)
  const [copied, setCopied] = useState('')

  const gen = useCallback(() => {
    setPasswords(Array.from({ length: count }, () => generate(length, opts)))
  }, [length, opts, count])

  const copy = (pwd: string) => {
    navigator.clipboard.writeText(pwd)
    setCopied(pwd)
    setTimeout(() => setCopied(''), 2000)
  }

  const toggleOpt = (k: string) => setOpts(o => ({ ...o, [k]: !o[k as keyof typeof o] }))

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Password Generator" description="Generate cryptographically secure random passwords with customizable length and character sets.">
      <div className="space-y-5">
        {/* Options */}
        <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">Length: <span className="text-orange-600 font-bold">{length}</span></label>
            </div>
            <input type="range" min={4} max={128} value={length} onChange={e => setLength(parseInt(e.target.value))}
              className="w-full accent-orange-600" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(opts).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={v} onChange={() => toggleOpt(k)} className="rounded accent-orange-600" />
                <span className="capitalize text-gray-700 dark:text-gray-300">{k}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-400">Count:</label>
            <input type="number" min={1} max={20} value={count} onChange={e => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
            <button onClick={gen} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700">
              <RefreshCw className="w-4 h-4" /> Generate
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {passwords.map((pwd, i) => {
            const s = strength(pwd)
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 group">
                <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white break-all">{pwd}</code>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded text-white font-medium ${s.color}`}>{s.label}</span>
                  <button onClick={() => copy(pwd)} className="p-1.5 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                    {copied === pwd ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ToolPageShell>
  )
}
