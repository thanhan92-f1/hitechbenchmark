'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Calendar, Loader2, Clock } from 'lucide-react'

interface AgeResult {
  domain: string
  registered: string | null
  updated: string | null
  expires: string | null
  registrar: string | null
  status: string[]
  ageYears: number | null
  ageDays: number | null
}

function calcAge(dateStr: string | null) {
  if (!dateStr) return { years: null, days: null }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { years: null, days: null }
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  const years = +(days / 365.25).toFixed(1)
  return { years, days }
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[140px_1fr] py-2 border-b border-gray-100 dark:border-gray-800">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-xs text-gray-800 dark:text-gray-200 font-mono break-all">{value}</span>
    </div>
  )
}

export default function DomainAgePage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AgeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const d = domain.trim().replace(/^https?:\/\//, '').split('/')[0]
      const res = await fetch(`/api/tools/domain/whois?domain=${encodeURIComponent(d)}`)
      const json = await res.json()
      if (!json.success) { setError(json.error ?? 'Lookup failed'); return }

      const rdap = json.data
      const registered = rdap.events?.find((e: { eventAction: string }) => e.eventAction === 'registration')?.eventDate
        ?? rdap.registrationDate ?? null
      const updated = rdap.events?.find((e: { eventAction: string }) => e.eventAction === 'last changed')?.eventDate
        ?? rdap.updatedDate ?? null
      const expires = rdap.events?.find((e: { eventAction: string }) => e.eventAction === 'expiration')?.eventDate
        ?? rdap.expirationDate ?? null
      const registrar = rdap.entities?.find((e: { roles: string[] }) => e.roles?.includes('registrar'))?.vcardArray?.[1]
        ?.find((v: string[]) => v[0] === 'fn')?.[3] ?? rdap.registrar ?? null

      const { years, days } = calcAge(registered)
      setResult({
        domain: d,
        registered: registered ?? null,
        updated: updated ?? null,
        expires: expires ?? null,
        registrar: registrar ?? null,
        status: rdap.status ?? [],
        ageYears: years,
        ageDays: days,
      })
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="domain"
      groupLabel="Domain & DNS"
      groupHref="/tools/domain"
      groupColor="blue"
      toolLabel="Domain Age"
      description="Kiểm tra tuổi đời của domain dựa trên ngày đăng ký từ dữ liệu RDAP/Whois."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {loading ? 'Looking up…' : 'Check'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Age highlight */}
            <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
              <div className="text-4xl font-bold text-gray-800 dark:text-white">
                {result.ageYears !== null ? `${result.ageYears} years` : 'Unknown age'}
              </div>
              {result.ageDays !== null && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{result.ageDays.toLocaleString()} days old</div>
              )}
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-2">{result.domain}</div>
            </div>

            {/* Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Registration Details</h3>
              </div>
              <div className="px-4 py-1">
                <InfoRow label="Registered" value={result.registered ? new Date(result.registered).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <InfoRow label="Last Updated" value={result.updated ? new Date(result.updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <InfoRow label="Expires" value={result.expires ? new Date(result.expires).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <InfoRow label="Registrar" value={result.registrar} />
                {result.status.length > 0 && (
                  <InfoRow label="Status" value={result.status.join(', ')} />
                )}
              </div>
            </div>

            {/* Expires soon warning */}
            {result.expires && (() => {
              const daysLeft = Math.floor((new Date(result.expires).getTime() - Date.now()) / 86400000)
              if (daysLeft < 60) return (
                <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${daysLeft < 14 ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 text-red-700 dark:text-red-300' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'}`}>
                  <Calendar className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Domain expires in <strong>{daysLeft}</strong> days ({new Date(result.expires).toLocaleDateString()}). {daysLeft < 14 ? 'Renew immediately!' : 'Consider renewing soon.'}</span>
                </div>
              )
              return null
            })()}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
