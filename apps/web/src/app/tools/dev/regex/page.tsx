'use client'

import { useState, useMemo } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

interface Match {
  index: number
  value: string
  groups?: Record<string, string>
}

const PRESETS = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'URL', pattern: 'https?:\\/\\/[^\\s]+', flags: 'g' },
  { label: 'Phone VN', pattern: '(?:\\+84|0)(?:3[2-9]|5[6-9]|7[06-9]|8[0-9]|9[0-9])\\d{7}', flags: 'g' },
  { label: 'Date', pattern: '\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}', flags: 'g' },
]

export default function RegexPage() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testStr, setTestStr] = useState('')

  const result = useMemo<{ matches: Match[]; error: string | null }>(() => {
    if (!pattern) return { matches: [], error: null }
    try {
      const re = new RegExp(pattern, flags)
      const matches: Match[] = []
      if (flags.includes('g')) {
        let m: RegExpExecArray | null
        const safeRe = new RegExp(pattern, flags)
        while ((m = safeRe.exec(testStr)) !== null) {
          matches.push({ index: m.index, value: m[0], groups: m.groups })
          if (m[0].length === 0) safeRe.lastIndex++
        }
      } else {
        const m = testStr.match(re)
        if (m) matches.push({ index: m.index ?? 0, value: m[0], groups: m.groups })
      }
      return { matches, error: null }
    } catch (e) {
      return { matches: [], error: (e as Error).message }
    }
  }, [pattern, flags, testStr])

  const highlighted = useMemo(() => {
    if (!result.matches.length || !testStr) return null
    let out = ''
    let prev = 0
    for (const m of result.matches) {
      out += testStr.slice(prev, m.index).replace(/</g, '&lt;')
      out += `<mark class="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded px-0.5">${m.value.replace(/</g, '&lt;')}</mark>`
      prev = m.index + m.value.length
    }
    out += testStr.slice(prev).replace(/</g, '&lt;')
    return out
  }, [result.matches, testStr])

  const toggleFlag = (f: string) => setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f)

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Regex Tester" description="Test and debug regular expressions with real-time matching and match highlighting.">
      <div className="space-y-4">
        {/* Pattern */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Regular Expression</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-lg">/</span>
            <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="pattern…"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
            <span className="text-gray-400 text-lg">/</span>
            <input value={flags} onChange={e => setFlags(e.target.value)} placeholder="gim"
              className="w-20 px-2 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
          </div>
          {result.error && <p className="text-xs text-red-500 mt-1">{result.error}</p>}
        </div>

        {/* Flags */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Flags:</span>
          {['g', 'i', 'm', 's'].map(f => (
            <label key={f} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={flags.includes(f)} onChange={() => toggleFlag(f)} className="rounded accent-orange-600" />
              <code className="text-gray-700 dark:text-gray-300">{f}</code>
              <span className="text-gray-400 text-xs">({['global', 'insensitive', 'multiline', 'dotAll'][['g','i','m','s'].indexOf(f)]})</span>
            </label>
          ))}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setPattern(p.pattern); setFlags(p.flags) }}
              className="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
              {p.label}
            </button>
          ))}
        </div>

        {/* Test String */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Test String</label>
          <textarea value={testStr} onChange={e => setTestStr(e.target.value)} rows={5}
            placeholder="Paste your test string here…"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
        </div>

        {/* Matches */}
        {testStr && pattern && !result.error && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {result.matches.length > 0 ? `${result.matches.length} match${result.matches.length !== 1 ? 'es' : ''}` : 'No matches'}
              </span>
            </div>

            {highlighted && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-mono whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlighted }} />
            )}

            {result.matches.length > 0 && (
              <div className="mt-3 space-y-1">
                {result.matches.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <span className="text-xs text-gray-400">#{i + 1} @{m.index}</span>
                    <code className="text-sm font-mono text-gray-900 dark:text-white">{m.value}</code>
                    {m.groups && Object.keys(m.groups).length > 0 && (
                      <span className="text-xs text-gray-400">{JSON.stringify(m.groups)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
