'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReputationData {
  ip: string
  listed: boolean
  privateIp?: boolean
  listedOn?: string[]
  checks: { dnsbl: string; listed: boolean }[]
  checkedAt: string
}

export function IpReputation({ ip }: { ip: string }) {
  const [data, setData] = useState<ReputationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ip) return
    fetch(`/api/tools/ip-reputation?ip=${encodeURIComponent(ip)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setData(json.data)
        else setError(json.error || 'Check failed')
      })
      .catch(() => setError('Check failed'))
      .finally(() => setLoading(false))
  }, [ip])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking IP reputation…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Shield className="w-4 h-4" />
        Reputation check unavailable
      </div>
    )
  }

  if (data.privateIp) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Shield className="w-4 h-4" />
        Private IP address — no reputation data
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        data.listed
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      )}>
        {data.listed
          ? <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
          : <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
        }
        <div>
          <p className={cn(
            'text-sm font-semibold',
            data.listed ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
          )}>
            {data.listed
              ? `Listed on ${data.listedOn?.length} blacklist${(data.listedOn?.length ?? 0) > 1 ? 's' : ''}`
              : 'Clean — not on any blacklist'
            }
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {data.checks.length} DNSBL sources checked · {new Date(data.checkedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {data.listed && data.listedOn && data.listedOn.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Listed on:</p>
          <div className="flex flex-wrap gap-1.5">
            {data.listedOn.map(dnsbl => (
              <span key={dnsbl} className="px-2 py-0.5 text-xs font-mono bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                {dnsbl}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compact DNSBL grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {data.checks.map(c => (
          <div key={c.dnsbl} className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
            c.listed
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', c.listed ? 'bg-red-500' : 'bg-green-500')} />
            <span className="truncate font-mono">{c.dnsbl.split('.').slice(-2).join('.')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
