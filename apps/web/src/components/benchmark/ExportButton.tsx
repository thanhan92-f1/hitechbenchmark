'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, FileJson, FileSpreadsheet, FileText } from 'lucide-react'

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url)
  if (!res.ok) return
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function ExportJsonButton({ uuid }: { uuid: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <button
      onClick={async () => {
        setLoading(true)
        try { await downloadFile(`/api/me/benchmarks/${uuid}/export/json`, `benchmark-${uuid.slice(0, 8)}.json`) }
        finally { setLoading(false) }
      }}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {loading ? 'Exporting…' : 'Export JSON'}
    </button>
  )
}

export function ExportDropdown({ uuid }: { uuid: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formats = [
    { id: 'json', label: 'JSON', icon: FileJson, ext: 'json' },
    { id: 'csv', label: 'CSV', icon: FileSpreadsheet, ext: 'csv' },
    { id: 'markdown', label: 'Markdown', icon: FileText, ext: 'md' },
  ]

  async function handleExport(fmt: string, ext: string) {
    setLoading(fmt)
    setOpen(false)
    try {
      await downloadFile(`/api/me/benchmarks/${uuid}/export/${fmt}`, `benchmark-${uuid.slice(0, 8)}.${ext}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {loading ? `Exporting…` : 'Export'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1">
          {formats.map(f => (
            <button
              key={f.id}
              onClick={() => handleExport(f.id, f.ext)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <f.icon className="w-4 h-4 text-gray-400" />
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
