'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Copy } from 'lucide-react'

function toWords(s: string) {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.toLowerCase())
}

const transforms: Record<string, (s: string) => string> = {
  'camelCase': s => { const w = toWords(s); return w[0] + w.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join('') },
  'PascalCase': s => toWords(s).map(w => w[0].toUpperCase() + w.slice(1)).join(''),
  'snake_case': s => toWords(s).join('_'),
  'SCREAMING_SNAKE': s => toWords(s).join('_').toUpperCase(),
  'kebab-case': s => toWords(s).join('-'),
  'UPPER-KEBAB': s => toWords(s).join('-').toUpperCase(),
  'dot.case': s => toWords(s).join('.'),
  'Title Case': s => toWords(s).map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  'UPPER CASE': s => s.toUpperCase(),
  'lower case': s => s.toLowerCase(),
  'Sentence case': s => { const lower = s.toLowerCase(); return lower[0].toUpperCase() + lower.slice(1) },
}

export default function CaseConverterPage() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState('')

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Case Converter" description="Convert text between camelCase, PascalCase, snake_case, kebab-case, Title Case and more.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Input Text</label>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="my variable name here"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
        </div>

        {input && (
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(transforms).map(([label, fn]) => {
              const converted = fn(input)
              return (
                <div key={label} className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 group">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    <code className="text-sm text-gray-900 dark:text-white truncate block">{converted}</code>
                  </div>
                  <button onClick={() => copy(converted)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
