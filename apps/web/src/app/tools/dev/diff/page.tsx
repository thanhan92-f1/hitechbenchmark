'use client'

import { useState, useMemo } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

interface DiffLine {
  type: 'equal' | 'add' | 'remove'
  text: string
}

function lineDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const result: DiffLine[] = []

  // Simple LCS-based line diff
  const m = linesA.length, n = linesB.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = linesA[i - 1] === linesB[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  function backtrack(i: number, j: number) {
    if (i === 0 && j === 0) return
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      backtrack(i - 1, j - 1)
      result.push({ type: 'equal', text: linesA[i - 1] })
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      backtrack(i, j - 1)
      result.push({ type: 'add', text: linesB[j - 1] })
    } else {
      backtrack(i - 1, j)
      result.push({ type: 'remove', text: linesA[i - 1] })
    }
  }

  backtrack(m, n)
  return result
}

export default function DiffPage() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [showDiff, setShowDiff] = useState(false)

  const diff = useMemo(() => showDiff ? lineDiff(a, b) : [], [a, b, showDiff])

  const stats = useMemo(() => ({
    added: diff.filter(l => l.type === 'add').length,
    removed: diff.filter(l => l.type === 'remove').length,
    unchanged: diff.filter(l => l.type === 'equal').length,
  }), [diff])

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Text Diff" description="Compare two text blocks and see the line-by-line differences highlighted.">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Original</label>
            <textarea value={a} onChange={e => setA(e.target.value)} rows={10}
              placeholder="Paste original text here…"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Modified</label>
            <textarea value={b} onChange={e => setB(e.target.value)} rows={10}
              placeholder="Paste modified text here…"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
          </div>
        </div>

        <button onClick={() => setShowDiff(true)} className="px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700">
          Compare
        </button>

        {showDiff && diff.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-3 text-sm">
              <span className="text-green-600">+{stats.added} added</span>
              <span className="text-red-600">-{stats.removed} removed</span>
              <span className="text-gray-400">{stats.unchanged} unchanged</span>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-auto max-h-96 font-mono text-sm">
                {diff.map((line, i) => (
                  <div key={i} className={`flex px-4 py-0.5 ${
                    line.type === 'add' ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300' :
                    line.type === 'remove' ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300' :
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    <span className="select-none w-5 mr-3 text-gray-400">
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                    </span>
                    <span className="whitespace-pre-wrap break-all">{line.text || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
