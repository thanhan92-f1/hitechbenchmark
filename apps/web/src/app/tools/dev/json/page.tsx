'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

export default function JSONFormatterPage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)

  const format = () => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const minify = () => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const validate = () => {
    try {
      JSON.parse(input)
      setError('')
      setOutput('✓ Valid JSON')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="JSON Formatter & Validator" description="Format, minify and validate JSON. Instantly see syntax errors with line/column information.">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Input JSON</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={14}
              placeholder={'{\n  "name": "example"\n}'}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Output</label>
            <textarea value={output} readOnly rows={14}
              placeholder="Formatted output…"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono resize-none" />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 font-mono">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Indent:</label>
            <select value={indent} onChange={e => setIndent(parseInt(e.target.value))}
              className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={0}>Tab</option>
            </select>
          </div>
          <button onClick={format} disabled={!input.trim()} className="px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50">
            Format
          </button>
          <button onClick={minify} disabled={!input.trim()} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            Minify
          </button>
          <button onClick={validate} disabled={!input.trim()} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            Validate
          </button>
          {output && output !== '✓ Valid JSON' && (
            <button onClick={() => navigator.clipboard.writeText(output)} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              Copy Output
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  )
}
