'use client'

import { useState } from 'react'
import { Plus, Trash2, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils'

interface Token {
  id: string
  name: string
  createdAt: string
  lastUsedAt?: string | null
  expiresAt?: string | null
}

export function ApiTokenManager({ initial }: { initial: Token[] }) {
  const [tokens, setTokens] = useState<Token[]>(initial)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [rawToken, setRawToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const createToken = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/me/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.message || 'Failed to create token')
        return
      }
      setRawToken(json.data.rawToken)
      setTokens((prev) => [json.data, ...prev])
      setName('')
      setCreating(false)
    } finally {
      setLoading(false)
    }
  }

  const revokeToken = async (id: string) => {
    setRevoking(id)
    try {
      const res = await fetch(`/api/me/tokens/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      setTokens((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setRevoking(null)
    }
  }

  const copyToken = () => {
    if (!rawToken) return
    navigator.clipboard.writeText(rawToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Raw token reveal */}
      {rawToken && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
            Save this token now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border border-yellow-200 dark:border-yellow-800 break-all text-gray-800 dark:text-gray-200">
              {rawToken}
            </code>
            <button
              onClick={copyToken}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setRawToken(null)}
            className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
          >
            I&apos;ve saved it, dismiss
          </button>
        </div>
      )}

      {/* Token list */}
      {tokens.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {tokens.map((token) => (
            <div key={token.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">{token.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Created {timeAgo(token.createdAt)}
                  {token.lastUsedAt && ` · Last used ${timeAgo(token.lastUsedAt)}`}
                  {token.expiresAt && ` · Expires ${timeAgo(token.expiresAt)}`}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="success">Active</Badge>
                <button
                  onClick={() => revokeToken(token.id)}
                  disabled={revoking === token.id}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Revoke token"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No API tokens. Create one to link benchmark submissions to your account.
          </p>
        </div>
      )}

      {/* Create form */}
      {creating ? (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createToken(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="Token name (e.g. my-vps)"
            maxLength={50}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createToken}
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '…' : 'Create'}
          </button>
          <button
            onClick={() => { setCreating(false); setName('') }}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus className="w-4 h-4" /> New token
          </button>
        </div>
      )}
    </div>
  )
}
