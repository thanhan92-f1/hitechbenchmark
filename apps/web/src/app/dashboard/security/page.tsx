'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody } from '@/components/ui/Card'
import { Shield, Smartphone, Mail, Key, CheckCircle, XCircle, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { startRegistration } from '@simplewebauthn/browser'
import Image from 'next/image'

interface Passkey {
  id: string
  name: string
  deviceType: string | null
  backedUp: boolean
  createdAt: string
}

interface MfaStatus {
  mfaTotpEnabled: boolean
  mfaEmailEnabled: boolean
  passkeys: Passkey[]
}

export default function SecurityPage() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // TOTP setup state
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qr: string } | null>(null)
  const [totpToken, setTotpToken] = useState('')
  const [totpDisableToken, setTotpDisableToken] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)
  const [totpError, setTotpError] = useState('')

  // Email 2FA state
  const [emailToggling, setEmailToggling] = useState(false)

  // Passkey state
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [passkeyError, setPasskeyError] = useState('')
  const [newPasskeyName, setNewPasskeyName] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const [meRes, pkRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/me/mfa/passkey'),
      ])
      const me = await meRes.json()
      const pks = await pkRes.json()
      setStatus({
        mfaTotpEnabled: me.data?.mfaTotpEnabled ?? false,
        mfaEmailEnabled: me.data?.mfaEmailEnabled ?? false,
        passkeys: pks.data ?? [],
      })
    } finally {
      setLoading(false)
    }
  }

  async function startTotpSetup() {
    setTotpLoading(true)
    setTotpError('')
    try {
      const res = await fetch('/api/me/mfa/totp/setup', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setTotpSetupData({ secret: json.data.secret, qr: json.data.qr })
      }
    } finally {
      setTotpLoading(false)
    }
  }

  async function verifyTotp() {
    if (totpToken.length !== 6) return
    setTotpLoading(true)
    setTotpError('')
    try {
      const res = await fetch('/api/me/mfa/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpToken }),
      })
      const json = await res.json()
      if (json.success) {
        setTotpSetupData(null)
        setTotpToken('')
        await fetchStatus()
      } else {
        setTotpError(json.error || 'Invalid code')
      }
    } finally {
      setTotpLoading(false)
    }
  }

  async function disableTotp() {
    if (totpDisableToken.length !== 6) return
    setTotpLoading(true)
    setTotpError('')
    try {
      const res = await fetch('/api/me/mfa/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpDisableToken }),
      })
      const json = await res.json()
      if (json.success) {
        setTotpDisableToken('')
        await fetchStatus()
      } else {
        setTotpError(json.error || 'Invalid code')
      }
    } finally {
      setTotpLoading(false)
    }
  }

  async function toggleEmailMfa() {
    setEmailToggling(true)
    try {
      await fetch('/api/me/mfa/email/toggle', { method: 'POST' })
      await fetchStatus()
    } finally {
      setEmailToggling(false)
    }
  }

  async function addPasskey() {
    setPasskeyLoading(true)
    setPasskeyError('')
    try {
      const optRes = await fetch('/api/me/mfa/passkey/register-options', { method: 'POST' })
      if (!optRes.ok) {
        setPasskeyError('Failed to get registration options')
        return
      }
      const options = await optRes.json()
      const regResp = await startRegistration({ optionsJSON: options })
      const verRes = await fetch('/api/me/mfa/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: regResp, name: newPasskeyName || 'My Passkey' }),
      })
      const verJson = await verRes.json()
      if (verJson.success) {
        setNewPasskeyName('')
        await fetchStatus()
      } else {
        setPasskeyError(verJson.error || 'Registration failed')
      }
    } catch (err) {
      setPasskeyError((err as Error).message || 'Registration failed')
    } finally {
      setPasskeyLoading(false)
    }
  }

  async function deletePasskey(id: string) {
    if (!confirm('Delete this passkey?')) return
    await fetch('/api/me/mfa/passkey', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchStatus()
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage two-factor authentication and passkeys</p>
      </div>

      {/* TOTP */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Authenticator app</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use Google Authenticator, Authy, or similar</p>
              </div>
            </div>
            {status?.mfaTotpEnabled ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                <XCircle className="w-3 h-3" /> Inactive
              </span>
            )}
          </div>

          {status?.mfaTotpEnabled ? (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Enter your 6-digit code to disable TOTP:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpDisableToken}
                  onChange={e => { setTotpDisableToken(e.target.value.replace(/\D/g, '')); setTotpError('') }}
                  placeholder="000000"
                  className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={disableTotp}
                  disabled={totpLoading || totpDisableToken.length !== 6}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  Disable
                </button>
              </div>
              {totpError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{totpError}</p>}
            </div>
          ) : totpSetupData ? (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
              </p>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={totpSetupData.qr} alt="TOTP QR Code" className="w-40 h-40 rounded-lg" />
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Manual entry key:</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{totpSetupData.secret}</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpToken}
                  onChange={e => { setTotpToken(e.target.value.replace(/\D/g, '')); setTotpError('') }}
                  placeholder="Enter 6-digit code"
                  className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={verifyTotp}
                  disabled={totpLoading || totpToken.length !== 6}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Activate
                </button>
              </div>
              {totpError && <p className="text-sm text-red-600 dark:text-red-400">{totpError}</p>}
              <button onClick={() => setTotpSetupData(null)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={startTotpSetup}
              disabled={totpLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Set up authenticator
            </button>
          )}
        </CardBody>
      </Card>

      {/* Email 2FA */}
      <Card>
        <CardBody>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Email 2FA</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive a code by email when signing in</p>
              </div>
            </div>
            <button
              onClick={toggleEmailMfa}
              disabled={emailToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                status?.mfaEmailEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${emailToggling ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  status?.mfaEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Passkeys */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Passkeys</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Biometric or hardware security keys</p>
            </div>
          </div>

          {status?.passkeys && status.passkeys.length > 0 && (
            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              {status.passkeys.map(pk => (
                <div key={pk.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{pk.name || 'Passkey'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pk.deviceType || 'Unknown device'} · Added {new Date(pk.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePasskey(pk.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newPasskeyName}
              onChange={e => setNewPasskeyName(e.target.value)}
              placeholder="Passkey name (optional)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={addPasskey}
              disabled={passkeyLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {passkeyLoading ? 'Registering…' : 'Add passkey'}
            </button>
          </div>
          {passkeyError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{passkeyError}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
