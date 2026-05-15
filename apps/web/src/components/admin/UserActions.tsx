'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function BlockUserButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !active }),
      })
      if (!res.ok) {
        const j = await res.json()
        alert(j.message || 'Action failed')
        return
      }
      setActive(!active)
    } catch {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'px-2 py-0.5 rounded border text-xs transition-colors disabled:opacity-50',
        active
          ? 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
      )}
    >
      {loading ? '…' : active ? 'Block' : 'Unblock'}
    </button>
  )
}

export function ChangeRoleSelect({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: string
}) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const handleChange = async (newRole: string) => {
    if (newRole === role) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const j = await res.json()
        alert(j.message || 'Action failed')
        return
      }
      setRole(newRole)
    } catch {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="text-xs px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
    >
      {['user', 'support', 'moderator', 'admin', 'super_admin'].map((r) => (
        <option key={r} value={r}>{r.replace('_', ' ')}</option>
      ))}
    </select>
  )
}
