'use client'

import { useState, useMemo } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'

const PRESETS = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every day at midnight', cron: '0 0 * * *' },
  { label: 'Every day at noon', cron: '0 12 * * *' },
  { label: 'Every Monday', cron: '0 9 * * 1' },
  { label: 'Every weekday', cron: '0 9 * * 1-5' },
  { label: 'Every month 1st', cron: '0 0 1 * *' },
  { label: 'Every Sunday midnight', cron: '0 0 * * 0' },
]

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function describePart(val: string, type: string): string {
  if (val === '*') return `every ${type}`
  if (val.startsWith('*/')) return `every ${val.slice(2)} ${type}s`
  if (val.includes('-')) {
    const [s, e] = val.split('-')
    if (type === 'weekday') return `${DAYS[parseInt(s)]}–${DAYS[parseInt(e)]}`
    if (type === 'month') return `${MONTHS[parseInt(s)]}–${MONTHS[parseInt(e)]}`
    return `${type}s ${s} to ${e}`
  }
  if (val.includes(',')) {
    const parts = val.split(',')
    if (type === 'weekday') return parts.map(p => DAYS[parseInt(p)]).join(', ')
    if (type === 'month') return parts.map(p => MONTHS[parseInt(p)]).join(', ')
    return `${type}s ${parts.join(', ')}`
  }
  if (type === 'weekday') return DAYS[parseInt(val)] ?? val
  if (type === 'month') return MONTHS[parseInt(val)] ?? val
  return `${type} ${val}`
}

function parseCron(expr: string) {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null

  const [minute, hour, dom, month, dow] = parts
  const descriptions = [
    describePart(minute, 'minute'),
    describePart(hour, 'hour'),
    describePart(dom, 'day of month'),
    describePart(month, 'month'),
    describePart(dow, 'weekday'),
  ]

  let human = 'Runs '
  if (minute === '*' && hour === '*') human += 'every minute'
  else if (minute.startsWith('*/') && hour === '*') human += `every ${minute.slice(2)} minutes`
  else if (hour !== '*') human += `at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  else human += `at minute ${minute}`

  if (dom !== '*') human += ` on day ${dom} of the month`
  if (month !== '*') human += ` in ${describePart(month, 'month')}`
  if (dow !== '*') human += ` on ${describePart(dow, 'weekday')}`

  return { descriptions, human, parts: { minute, hour, dom, month, dow } }
}

export default function CronPage() {
  const [expr, setExpr] = useState('0 9 * * 1-5')
  const result = useMemo(() => parseCron(expr), [expr])

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Cron Expression Parser" description="Parse and explain cron job expressions in plain English.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cron Expression</label>
          <input type="text" value={expr} onChange={e => setExpr(e.target.value)}
            placeholder="* * * * *"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
          <p className="text-xs text-gray-400 mt-1">Format: minute hour day-of-month month day-of-week</p>
        </div>

        {result ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 bg-orange-50 dark:bg-orange-950/30">
              <p className="text-base font-semibold text-orange-700 dark:text-orange-300">{result.human}</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[['Minute', 'minute'], ['Hour', 'hour'], ['Day of Month', 'dom'], ['Month', 'month'], ['Day of Week', 'dow']].map(([label, key], i) => (
                <div key={key} className="flex gap-4 px-5 py-2.5">
                  <code className="text-sm font-mono text-orange-600 dark:text-orange-400 w-16 shrink-0">
                    {result.parts[key as keyof typeof result.parts]}
                  </code>
                  <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-900 dark:text-white">{result.descriptions[i]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-500">Invalid cron expression (must have exactly 5 fields)</p>
        )}

        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.cron} onClick={() => setExpr(p.cron)}
                className="px-2.5 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 transition-colors text-gray-700 dark:text-gray-300">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ToolPageShell>
  )
}
