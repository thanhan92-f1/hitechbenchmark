'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/Card'
import { Mail, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) router.replace('/register')
  }, [email, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  const handleInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    setError('')
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) {
      submit(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      submit(text)
    }
  }

  async function submit(code: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      const json = await res.json()
      if (json.success) {
        setVerified(true)
        setTimeout(() => router.push('/login?verified=1'), 2000)
      } else {
        setError(json.error || 'Invalid code')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setResending(true)
    try {
      const res = await fetch('/api/auth/verify-email?action=resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.success) {
        setResendCooldown(120)
        setError('')
      } else {
        setError(json.error || 'Could not resend')
      }
    } finally {
      setResending(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email verified!</h1>
          <p className="text-gray-500 dark:text-gray-400">Redirecting to sign in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>
          </p>
        </div>

        <Card>
          <CardBody className="space-y-6">
            <div>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    disabled={loading}
                    className="w-11 h-14 text-center text-xl font-mono font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center mt-3">{error}</p>
              )}
            </div>

            <button
              onClick={() => submit(otp.join(''))}
              disabled={loading || otp.some(d => !d)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying…' : <><span>Verify email</span><ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="text-center">
              <button
                onClick={resend}
                disabled={resending || resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </CardBody>
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center px-4 text-gray-500 dark:text-gray-400">Loading verification…</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
