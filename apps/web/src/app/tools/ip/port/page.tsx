'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const COMMON_PORTS = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 465, service: 'SMTPS' },
  { port: 587, service: 'SMTP TLS' },
  { port: 993, service: 'IMAPS' },
  { port: 995, service: 'POP3S' },
  { port: 3306, service: 'MySQL' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 8080, service: 'HTTP Alt' },
  { port: 8443, service: 'HTTPS Alt' },
  { port: 27017, service: 'MongoDB' },
]

interface PortResult { port: number; service: string; open: boolean }

export default function PortScannerPage() {
  const [host, setHost] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PortResult[]>([])
  const [customPort, setCustomPort] = useState('')

  const scan = async () => {
    if (!host.trim()) return
    setLoading(true)
    setResults([])
    try {
      const res = await fetch(`/api/tools/ip/port?host=${encodeURIComponent(host.trim())}`)
      const json = await res.json()
      if (json.success) setResults(json.results)
    } catch { }
    finally { setLoading(false) }
  }

  const scanCustom = async () => {
    const port = parseInt(customPort)
    if (!host.trim() || isNaN(port)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tools/ip/port?host=${encodeURIComponent(host.trim())}&ports=${port}`)
      const json = await res.json()
      if (json.success) {
        setResults(prev => {
          const filtered = prev.filter(r => r.port !== port)
          return [...filtered, ...json.results].sort((a, b) => a.port - b.port)
        })
      }
    } catch { }
    finally { setLoading(false) }
  }

  const open = results.filter(r => r.open).length

  return (
    <ToolPageShell groupId="ip" groupLabel="IP & Network" groupHref="/tools/ip" groupColor="purple"
      toolLabel="Port Scanner" description="Check if common TCP ports are open on any host. Scans run server-side.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={host} onChange={e => setHost(e.target.value)} onKeyDown={e => e.key === 'Enter' && scan()}
            placeholder="example.com or 1.2.3.4"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={scan} disabled={loading || !host.trim()} className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Scan Common
          </button>
        </div>

        <div className="flex gap-2">
          <input type="number" value={customPort} onChange={e => setCustomPort(e.target.value)}
            placeholder="Custom port (e.g. 3000)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={scanCustom} disabled={loading || !host.trim() || !customPort} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            Check Port
          </button>
        </div>

        {results.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{open} open / {results.length - open} closed</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {results.sort((a, b) => a.port - b.port).map(r => (
                <div key={r.port} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${r.open ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                  {r.open ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
                  <span className={`font-mono text-sm font-semibold w-12 shrink-0 ${r.open ? 'text-green-700 dark:text-green-300' : 'text-gray-400'}`}>{r.port}</span>
                  <span className={`text-sm ${r.open ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{r.service}</span>
                  <span className={`ml-auto text-xs font-medium ${r.open ? 'text-green-600' : 'text-gray-400'}`}>{r.open ? 'OPEN' : 'closed'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400">Scans use TCP connect. Only scan hosts you own or have permission to scan.</p>
      </div>
    </ToolPageShell>
  )
}
