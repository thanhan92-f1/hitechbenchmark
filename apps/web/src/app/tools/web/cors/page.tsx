'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Shield, ShieldAlert, ShieldCheck, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface CorsResult {
  corsEnabled: boolean; wildcardOrigin: boolean; credentialsCorsIssue: boolean; testedOrigin: string
  headers: Record<string, string | null>; httpStatus: number; optionsStatus: number | null
}

function HeaderRow({ name, value }: { name: string; value: string | null }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="py-2 pr-4 text-xs font-mono text-blue-700 dark:text-blue-300 whitespace-nowrap">{name}</td>
      <td className="py-2 text-xs font-mono break-all">
        {value
          ? <span className="text-gray-800 dark:text-gray-200">{value}</span>
          : <span className="text-gray-400 italic">not set</span>
        }
      </td>
    </tr>
  )
}

export default function CORSPage() {
  const [url, setUrl] = useState('')
  const [origin, setOrigin] = useState('https://test.example.com')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CorsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!url.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const params = new URLSearchParams({ url, origin })
      const res = await fetch(`/api/tools/web/cors?${params}`)
      const json = await res.json()
      if (json.success) setResult(json)
      else setError(json.error ?? 'Check failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="web"
      groupLabel="Web & SEO"
      groupHref="/tools/web"
      groupColor="red"
      toolLabel="CORS Check"
      description="Kiểm tra cấu hình CORS headers của API endpoint. Phát hiện wildcard origins và cấu hình có vấn đề."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button onClick={check} disabled={loading || !url.trim()} className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? 'Checking…' : 'Check'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Test origin:</label>
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Status summary */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${
              result.credentialsCorsIssue
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
                : result.corsEnabled
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            }`}>
              {result.credentialsCorsIssue
                ? <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
                : result.corsEnabled
                ? <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                : <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
              }
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-white">
                  {result.corsEnabled ? 'CORS is configured' : 'CORS not configured'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  HTTP {result.httpStatus} · Tested origin: {result.testedOrigin}
                </p>
              </div>
            </div>

            {/* Security indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'CORS Enabled', ok: result.corsEnabled, invert: false },
                { label: 'Wildcard Origin (*)', ok: !result.wildcardOrigin, invert: true, warn: result.wildcardOrigin },
                { label: 'Credentials Issue', ok: !result.credentialsCorsIssue, invert: true },
              ].map(({ label, ok, invert, warn }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${
                  ok ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30' :
                  warn ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' :
                  'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                }`}>
                  {ok
                    ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    : warn
                    ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  }
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
                </div>
              ))}
            </div>

            {/* Headers table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">CORS Response Headers</h3>
              </div>
              <div className="px-4 py-1">
                <table className="w-full">
                  <tbody>
                    {Object.entries(result.headers).map(([k, v]) => <HeaderRow key={k} name={k} value={v} />)}
                  </tbody>
                </table>
              </div>
            </div>

            {result.credentialsCorsIssue && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Security issue: <code className="font-mono">Access-Control-Allow-Origin: *</code> cannot be used with <code className="font-mono">Access-Control-Allow-Credentials: true</code>. Browsers will reject such responses.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
