'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { AlertTriangle, CheckCircle } from 'lucide-react'

function decodeJwt(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Not a valid JWT (must have 3 parts separated by dots)')

  const decodeB64 = (s: string) => {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - s.length % 4)
    return JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad))
  }

  const header = decodeB64(parts[0])
  const payload = decodeB64(parts[1])
  const sig = parts[2]

  const now = Math.floor(Date.now() / 1000)
  const expired = payload.exp ? payload.exp < now : false
  const notBefore = payload.nbf ? payload.nbf > now : false

  return { header, payload, sig, expired, notBefore, expiresAt: payload.exp ? new Date(payload.exp * 1000) : null }
}

export default function JWTDecoderPage() {
  const [token, setToken] = useState('')
  const [result, setResult] = useState<ReturnType<typeof decodeJwt> | null>(null)
  const [error, setError] = useState('')

  const decode = () => {
    setError('')
    setResult(null)
    try {
      setResult(decodeJwt(token.trim()))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="JWT Decoder" description="Decode and inspect JWT tokens. View header, payload claims and expiry. Does not verify signatures.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">JWT Token</label>
          <textarea value={token} onChange={e => setToken(e.target.value)} rows={4}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono resize-none" />
        </div>

        <button onClick={decode} disabled={!token.trim()} className="px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50">
          Decode
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Status */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${result.expired ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40'}`}>
              {result.expired
                ? <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                : <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              }
              <div className="text-sm">
                <span className={result.expired ? 'text-red-700 dark:text-red-300 font-semibold' : 'text-green-700 dark:text-green-300 font-semibold'}>
                  {result.expired ? 'Token Expired' : 'Token Valid'}
                </span>
                {result.expiresAt && (
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {result.expired ? 'expired' : 'expires'} {result.expiresAt.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Header */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Header</h3>
              <pre className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-mono text-gray-900 dark:text-white overflow-auto">
                {JSON.stringify(result.header, null, 2)}
              </pre>
            </div>

            {/* Payload */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payload</h3>
              <pre className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-mono text-gray-900 dark:text-white overflow-auto">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
            </div>

            <p className="text-xs text-gray-400">
              ⚠ This tool only decodes — it does NOT verify the signature. Never trust token claims without server-side verification.
            </p>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
