'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { FileCode, Loader2, CheckCircle, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react'

interface CertResult {
  type: 'certificate' | 'csr'
  subject: Record<string, string>
  issuer?: Record<string, string>
  validity?: { from: string; to: string; daysLeft: number; expired: boolean }
  serialNumber?: string
  fingerprint?: string
  fingerprint256?: string
  subjectAltNames?: Array<{ type: string; value: string }>
  keyUsage?: string[]
  publicKey: { type: string; bits: number | null }
  isCA?: boolean
}

const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJemDeGNr67LMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMTBnRl
c3QgQ0EwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYDVQQD
Ewlsb2NhbGhvc3QwXDANBgkqhkiG9w0BAQEFAANLADBIAkEA1LgKAnplwJTHjbMQ
JHFHwLXuFRFJf8A3hfz1N0oa7h8aPVwmJWiILxKDVFDjbRPCImhRR/I4M5GUZuHJ
BDN31wIDAQABMA0GCSqGSIb3DQEBCwUAA0EAkRs6Jm2+A7lRn6kRqsFxJjRFEjj2
qYg0S3M5o/0cIJpgkf6D4FZ0XvHfp1Mx9t5GZ5mXJqRxGJOTLt4CjFAexg==
-----END CERTIFICATE-----`

function InfoRow({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[160px_1fr] py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className={`text-xs text-gray-800 dark:text-gray-200 break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

export default function CSRDecoderPage() {
  const [pem, setPem] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CertResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decode = async () => {
    if (!pem.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch('/api/tools/ssl/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pem }),
      })
      const json = await res.json()
      if (json.success) setResult(json)
      else setError(json.error ?? 'Decode failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const daysColor = (days: number) =>
    days < 0 ? 'text-red-600' : days < 30 ? 'text-amber-600' : 'text-green-600'

  return (
    <ToolPageShell
      groupId="ssl"
      groupLabel="SSL Tools"
      groupHref="/tools/ssl"
      groupColor="green"
      toolLabel="CSR / Certificate Decoder"
      description="Decode CSR và X.509 certificate PEM để xem subject, issuer, validity, SANs, fingerprints và thông tin khóa."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Paste PEM content</label>
            <button onClick={() => { setPem(SAMPLE_CERT); setResult(null); setError(null) }} className="text-xs text-blue-600 hover:underline">Load sample</button>
          </div>
          <textarea
            value={pem}
            onChange={e => setPem(e.target.value)}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            rows={8}
            className="w-full px-3 py-2.5 text-xs font-mono border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
          />
          <button
            onClick={decode}
            disabled={loading || !pem.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            {loading ? 'Decoding…' : 'Decode'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Type badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${result.type === 'certificate' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                {result.type === 'certificate' ? 'X.509 Certificate' : 'Certificate Signing Request (CSR)'}
              </span>
              {result.isCA && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> CA Certificate
                </span>
              )}
            </div>

            {/* Validity */}
            {result.validity && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${result.validity.expired ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40' : result.validity.daysLeft < 30 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40'}`}>
                {result.validity.expired
                  ? <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  : result.validity.daysLeft < 30
                  ? <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  : <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                }
                <div>
                  <p className={`font-semibold text-sm ${daysColor(result.validity.daysLeft)}`}>
                    {result.validity.expired ? 'Certificate EXPIRED' : `Valid for ${result.validity.daysLeft} more days`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(result.validity.from).toLocaleDateString()} → {new Date(result.validity.to).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject</h3>
              </div>
              <div className="px-4 py-1">
                {Object.entries(result.subject).map(([k, v]) => <InfoRow key={k} label={k} value={v} />)}
              </div>
            </div>

            {/* Issuer */}
            {result.issuer && Object.keys(result.issuer).length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Issuer</h3>
                </div>
                <div className="px-4 py-1">
                  {Object.entries(result.issuer).map(([k, v]) => <InfoRow key={k} label={k} value={v} />)}
                </div>
              </div>
            )}

            {/* SANs */}
            {result.subjectAltNames && result.subjectAltNames.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject Alternative Names ({result.subjectAltNames.length})</h3>
                </div>
                <div className="px-4 py-2 space-y-1">
                  {result.subjectAltNames.map((san, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="text-gray-400 w-12 shrink-0">{san.type}</span>
                      <code className="font-mono text-gray-800 dark:text-gray-200">{san.value}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Technical Details</h3>
              </div>
              <div className="px-4 py-1">
                <InfoRow label="Key Type" value={result.publicKey.type?.toUpperCase()} />
                <InfoRow label="Key Size" value={result.publicKey.bits ? `${result.publicKey.bits} bits` : null} />
                <InfoRow label="Serial Number" value={result.serialNumber} mono />
                <InfoRow label="SHA-1 Fingerprint" value={result.fingerprint} mono />
                <InfoRow label="SHA-256 Fingerprint" value={result.fingerprint256} mono />
                {result.keyUsage && <InfoRow label="Key Usage" value={result.keyUsage.join(', ')} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
