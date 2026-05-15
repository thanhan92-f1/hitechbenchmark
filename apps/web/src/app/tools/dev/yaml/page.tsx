'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { ArrowLeftRight, Copy, Trash2, CheckCircle, XCircle } from 'lucide-react'

// ── YAML parser (common subset) ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YV = null | boolean | number | string | any[] | Record<string, any>

function parseYAML(src: string): YV {
  const lines = src.split('\n').map(l => l.replace(/\r$/, ''))
  let pos = 0

  function skip() {
    while (pos < lines.length) {
      const t = lines[pos].trimStart()
      if (t === '' || t.startsWith('#')) pos++
      else break
    }
  }

  function ind(line: string) { return /^( *)/.exec(line)![1].length }

  function stripComment(s: string) {
    let q = ''
    for (let i = 0; i < s.length; i++) {
      if (!q && (s[i] === '"' || s[i] === "'")) q = s[i]
      else if (q && s[i] === q) q = ''
      else if (!q && s[i] === ' ' && s[i + 1] === '#') return s.slice(0, i).trimEnd()
    }
    return s
  }

  function coerce(s: string): YV {
    s = stripComment(s).trim()
    if (!s || s === 'null' || s === '~') return null
    if (s === 'true' || s === 'yes') return true
    if (s === 'false' || s === 'no') return false
    if (/^-?\d+$/.test(s)) return +s
    if (/^-?\d*\.\d+$/.test(s)) return +s
    if (s[0] === '"' && s.endsWith('"'))
      return s.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    if (s[0] === "'" && s.endsWith("'"))
      return s.slice(1, -1).replace(/''/g, "'")
    return s
  }

  function colonAt(s: string) {
    let q = ''
    for (let i = 0; i < s.length; i++) {
      if (!q && (s[i] === '"' || s[i] === "'")) q = s[i]
      else if (q && s[i] === q) q = ''
      else if (!q && s[i] === ':' && (i + 1 >= s.length || s[i + 1] === ' ' || s[i + 1] === '\n')) return i
    }
    return -1
  }

  function parseNode(baseInd: number): YV {
    skip()
    if (pos >= lines.length) return null
    const line = lines[pos]
    const li = ind(line)
    if (li < baseInd) return null
    const s = line.trim()

    // Sequence
    if (s.startsWith('- ') || s === '-') {
      const arr: YV[] = []
      while (pos < lines.length) {
        skip()
        if (pos >= lines.length) break
        const l = lines[pos], lind = ind(l), lt = l.trim()
        if (lind < li) break
        if (lind > li) break
        if (!lt.startsWith('- ') && lt !== '-') break
        pos++
        const rest = lt === '-' ? '' : lt.slice(2).trim()
        if (!rest) {
          skip()
          arr.push(pos < lines.length && ind(lines[pos]) > li ? parseNode(ind(lines[pos])) : null)
        } else {
          const ci = colonAt(rest)
          if (ci > 0) {
            const obj: Record<string, YV> = {}
            const k = rest.slice(0, ci).trim().replace(/^["']|["']$/g, '')
            const v = rest.slice(ci + 1).trim()
            obj[k] = v ? coerce(v) : null
            while (pos < lines.length) {
              skip()
              if (pos >= lines.length) break
              const nl = lines[pos], ni = ind(nl), nt = nl.trim()
              if (ni <= li || nt.startsWith('- ') || nt === '-') break
              const nci = colonAt(nt)
              if (nci < 0) break
              pos++
              const nk = nt.slice(0, nci).trim().replace(/^["']|["']$/g, '')
              const nv = nt.slice(nci + 1).trim()
              if (nv) obj[nk] = coerce(nv)
              else {
                skip()
                obj[nk] = pos < lines.length && ind(lines[pos]) > ni ? parseNode(ind(lines[pos])) : null
              }
            }
            arr.push(obj)
          } else arr.push(coerce(rest))
        }
      }
      return arr
    }

    // Mapping
    if (colonAt(s) > 0) {
      const obj: Record<string, YV> = {}
      while (pos < lines.length) {
        skip()
        if (pos >= lines.length) break
        const l = lines[pos], lind = ind(l), lt = l.trim()
        if (lind < li || lind > li || lt.startsWith('- ')) break
        const ci = colonAt(lt)
        if (ci < 0) break
        pos++
        const key = lt.slice(0, ci).trim().replace(/^["']|["']$/g, '')
        const valRaw = lt.slice(ci + 1).trim()
        if (valRaw === '|' || valRaw === '>') {
          const fold = valRaw === '>'
          const parts: string[] = [], bInd = li + 2
          while (pos < lines.length) {
            const bl = lines[pos]
            if (bl.trim() === '') { parts.push(''); pos++; continue }
            if (ind(bl) < bInd) break
            parts.push(bl.slice(bInd)); pos++
          }
          while (parts.length && !parts[parts.length - 1]) parts.pop()
          obj[key] = fold ? parts.join(' ').trim() : parts.join('\n')
        } else if (valRaw) {
          obj[key] = coerce(valRaw)
        } else {
          skip()
          obj[key] = pos < lines.length && ind(lines[pos]) > li ? parseNode(ind(lines[pos])) : null
        }
      }
      return obj
    }

    pos++
    return coerce(s)
  }

  skip()
  if (pos >= lines.length) return null
  return parseNode(ind(lines[pos]))
}

// ── JSON → YAML ─────────────────────────────────────────────────────────────
function toYAML(val: unknown, depth = 0): string {
  const pad = '  '.repeat(depth)
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'boolean') return String(val)
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') {
    if (!val) return '""'
    if (/^(true|false|null|yes|no|~)$/.test(val) || /^\s|\s$/.test(val) ||
        /[:#,\[\]{}|>&*!%@`]/.test(val) || val.includes('\n') || /^\d/.test(val)) {
      return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`
    }
    return val
  }
  if (Array.isArray(val)) {
    if (!val.length) return '[]'
    return val.map(item => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item as Record<string, unknown>)
        if (!entries.length) return `${pad}-`
        return entries.map(([k, v], idx) => {
          const prefix = idx === 0 ? `${pad}- ` : `${pad}  `
          if (typeof v === 'object' && v !== null)
            return `${prefix}${k}:\n${toYAML(v, depth + 2)}`
          return `${prefix}${k}: ${toYAML(v, 0)}`
        }).join('\n')
      }
      const vs = toYAML(item, 0)
      if (typeof item === 'object' && item !== null) return `${pad}-\n${toYAML(item, depth + 1)}`
      return `${pad}- ${vs}`
    }).join('\n')
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>)
    if (!entries.length) return '{}'
    return entries.map(([k, v]) => {
      if (typeof v === 'object' && v !== null) return `${pad}${k}:\n${toYAML(v, depth + 1)}`
      return `${pad}${k}: ${toYAML(v, 0)}`
    }).join('\n')
  }
  return String(val)
}

// ── Component ────────────────────────────────────────────────────────────────
export default function YAMLPage() {
  const [yaml, setYaml] = useState('')
  const [json, setJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'yaml' | 'json' | null>(null)

  const yamlToJson = () => {
    setError(null)
    try {
      const parsed = parseYAML(yaml)
      setJson(JSON.stringify(parsed, null, 2))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const jsonToYaml = () => {
    setError(null)
    try {
      const parsed = JSON.parse(json)
      setYaml(toYAML(parsed))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const copy = async (side: 'yaml' | 'json') => {
    await navigator.clipboard.writeText(side === 'yaml' ? yaml : json)
    setCopied(side)
    setTimeout(() => setCopied(null), 1500)
  }

  const SAMPLE_YAML = `name: my-app
version: "1.0.0"
database:
  host: localhost
  port: 5432
  credentials:
    user: admin
    password: secret
features:
  - name: auth
    enabled: true
  - name: analytics
    enabled: false
tags:
  - web
  - api`

  return (
    <ToolPageShell
      groupId="dev"
      groupLabel="Developer Tools"
      groupHref="/tools/dev"
      groupColor="orange"
      toolLabel="YAML ↔ JSON Converter"
      description="Chuyển đổi qua lại giữa YAML và JSON. Hỗ trợ cấu trúc lồng nhau, mảng, và kiểu dữ liệu thông thường."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <button
            onClick={() => { setYaml(SAMPLE_YAML); setJson(''); setError(null) }}
            className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Load sample
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => { setYaml(''); setJson(''); setError(null) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* YAML side */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">YAML</label>
              <button onClick={() => copy('yaml')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                {copied === 'yaml' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'yaml' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              value={yaml}
              onChange={e => setYaml(e.target.value)}
              placeholder="Enter YAML here…"
              rows={18}
              className="w-full px-3 py-2.5 text-sm font-mono border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
            />
            <button
              onClick={yamlToJson}
              disabled={!yaml.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <ArrowLeftRight className="w-4 h-4" /> YAML → JSON
            </button>
          </div>

          {/* JSON side */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">JSON</label>
              <button onClick={() => copy('json')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                {copied === 'json' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'json' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              value={json}
              onChange={e => setJson(e.target.value)}
              placeholder="Enter JSON here…"
              rows={18}
              className="w-full px-3 py-2.5 text-sm font-mono border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
            />
            <button
              onClick={jsonToYaml}
              disabled={!json.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <ArrowLeftRight className="w-4 h-4" /> JSON → YAML
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 font-mono">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Supports scalars, nested objects, arrays, quoted strings, block scalars (|, &gt;), and inline comments.
          For complex YAML features (anchors, tags), consider dedicated libraries.
        </p>
      </div>
    </ToolPageShell>
  )
}
