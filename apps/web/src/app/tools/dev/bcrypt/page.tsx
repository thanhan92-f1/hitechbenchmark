'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function BcryptPage() {
  const [input, setInput] = useState('')
  const [rounds, setRounds] = useState(12)
  const [hash, setHash] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)

  const hashPwd = async () => {
    if (!input) return
    setLoading(true)
    try {
      const res = await fetch('/api/tools/dev/bcrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hash', password: input, rounds }),
      })
      const json = await res.json()
      if (json.hash) setHash(json.hash)
    } catch {
      setHash('Error: Failed to hash')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    if (!input || !verifyHash) return
    setLoading(true)
    try {
      const res = await fetch('/api/tools/dev/bcrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', password: input, hash: verifyHash }),
      })
      const json = await res.json()
      setVerifyResult(json.match)
    } catch {
      setVerifyResult(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPageShell groupId="dev" groupLabel="Developer Tools" groupHref="/tools/dev" groupColor="orange"
      toolLabel="Bcrypt Hash" description="Hash passwords with bcrypt and verify existing bcrypt hashes. Performed server-side.">
      <div className="space-y-6">
        {/* Hash */}
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-600" /> Hash Password
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input type="password" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Enter password to hash"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Rounds:</label>
              <select value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                {[10, 11, 12, 13, 14].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={hashPwd} disabled={loading || !input} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Hash
            </button>
          </div>
          {hash && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Bcrypt hash</span>
                <button onClick={() => navigator.clipboard.writeText(hash)} className="text-xs text-orange-600 hover:underline">Copy</button>
              </div>
              <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{hash}</code>
            </div>
          )}
        </div>

        {/* Verify */}
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-600" /> Verify Password
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bcrypt Hash to verify against</label>
            <input type="text" value={verifyHash} onChange={e => { setVerifyHash(e.target.value); setVerifyResult(null) }}
              placeholder="$2b$12$..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
          </div>
          <button onClick={verify} disabled={loading || !input || !verifyHash} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify
          </button>
          {verifyResult !== null && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${verifyResult ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40'}`}>
              {verifyResult
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <XCircle className="w-5 h-5 text-red-600" />
              }
              <span className={`font-semibold text-sm ${verifyResult ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {verifyResult ? 'Password matches!' : 'Password does NOT match'}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400">Bcrypt hashing runs server-side. The password is sent to our server only for the duration of this request and not stored.</p>
      </div>
    </ToolPageShell>
  )
}
