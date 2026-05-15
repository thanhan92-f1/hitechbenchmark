'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

const ENTITIES: [string, string][] = [
  ['&', '&amp;'], ['<', '&lt;'], ['>', '&gt;'], ['"', '&quot;'], ["'", '&#039;'],
  ['©', '&copy;'], ['®', '&reg;'], ['™', '&trade;'], ['€', '&euro;'],
  ['£', '&pound;'], ['¥', '&yen;'], ['°', '&deg;'], ['…', '&hellip;'],
]

function encode(s: string) {
  return ENTITIES.reduce((acc, [char, entity]) => acc.replaceAll(char, entity), s)
}

function decode(s: string) {
  const div = document.createElement('div')
  div.innerHTML = s
  return div.textContent ?? ''
}

export default function HTMLEncodePage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const process = () => {
    try {
      setOutput(mode === 'encode' ? encode(input) : decode(input))
    } catch {
      setOutput('Error processing input')
    }
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="HTML Encode / Decode" description="Encode special characters to HTML entities or decode HTML entities back to characters.">
      <div className="space-y-4">
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden w-fit">
          {(['encode', 'decode'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {mode === 'encode' ? 'Plain text / HTML' : 'HTML entities'}
            </label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={8}
              placeholder={mode === 'encode' ? '<p>Hello "World" & more</p>' : '&lt;p&gt;Hello &amp; World&lt;/p&gt;'}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Output</label>
            <textarea value={output} readOnly rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono resize-none" />
          </div>
        </div>

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

        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Common HTML Entities</p>
          <div className="flex flex-wrap gap-2">
            {ENTITIES.map(([char, entity]) => (
              <span key={entity} className="text-xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {char} = {entity}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ToolPageShell>
  )
}
