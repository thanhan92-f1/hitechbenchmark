'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/Card'
import { Shield, Smartphone, Mail, Key, RefreshCw, ArrowRight, CheckCircle } from 'lucide-react'
import { startAuthentication } from '@simplewebauthn/browser'

export const dynamic = 'force-dynamic'

type Method = 'totp' | 'email' | 'passkey'

export default function MfaChallengePage() {
  const sessionState = useSession()
  const session = sessionState?.data
  const updateSession = sessionState?.update
  const router = useRouter()
  const [method, setMethod] = useState<Method>('totp')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session?.user?.mfaRequired && !verified) {
      router.replace('/dashboard')
    }
  }, [session, verified, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  async function sendEmailCode() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/mfa-challenge?action=send', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setResendCooldown(60)
      } else {
        setError(json.error || 'Failed to send code')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleMethodChange(m: Method) {
    setMethod(m)
    setCode('')
    setError('')
    if (m === 'email') {
      await sendEmailCode()
    }
    if (m === 'passkey') {
      await handlePasskey()
    }
  }

  async function handlePasskey() {
    setLoading(true)
    setError('')
    try {
      const optRes = await fetch('/api/me/mfa/passkey/auth-options', { method: 'POST' })
      if (!optRes.ok) {
        setError('No passkeys registered')
        setLoading(false)
        return
      }
      const options = await optRes.json()
      const authResp = await startAuthentication({ optionsJSON: options })
      const verRes = await fetch('/api/me/mfa/passkey/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResp }),
      })
      const verJson = await verRes.json()
      if (verJson.success) {
        await completeVerification()
      } else {
        setError(verJson.error || 'Passkey authentication failed')
      }
    } catch (err) {
      setError((err as Error).message || 'Passkey authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function completeVerification() {
    setVerified(true)
    await updateSession?.({ mfaRequired: false })
    setTimeout(() => router.push('/dashboard'), 1000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length < 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/mfa-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, code }),
      })
      const json = await res.json()
      if (json.success) {
        await completeVerification()
      } else {
        setError(json.error || 'Invalid code')
        setCode('')
        codeRef.current?.focus()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verified!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Two-factor verification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Additional verification required
          </p>
        </div>

        {/* Method tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
          {([
            { id: 'totp' as Method, icon: Smartphone, label: 'Authenticator' },
            { id: 'email' as Method, icon: Mail, label: 'Email' },
            { id: 'passkey' as Method, icon: Key, label: 'Passkey' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleMethodChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-colors ${
                method === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <CardBody className="space-y-4">
            {method === 'passkey' ? (
              <div className="text-center py-4">
                <Key className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Use your registered passkey or security key to authenticate.
                </p>
                <button
                  onClick={handlePasskey}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Waiting for passkey…' : 'Authenticate with passkey'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {method === 'totp' ? 'Authenticator code' : 'Email verification code'}
                  </label>
                  <input
                    ref={codeRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                    placeholder="000000"
                    autoFocus
                    className="w-full px-3 py-2.5 text-center text-2xl font-mono font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Verifying…' : <><span>Verify</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                {method === 'email' && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={sendEmailCode}
                      disabled={sending || resendCooldown > 0}
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
