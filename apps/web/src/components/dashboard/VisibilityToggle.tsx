'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function VisibilityToggle({
  uuid,
  initial,
}: {
  uuid: string
  initial: 'public' | 'private'
}) {
  const [visibility, setVisibility] = useState(initial)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    const next = visibility === 'public' ? 'private' : 'public'
    setLoading(true)
    try {
      const res = await fetch(`/api/me/benchmarks/${uuid}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: next }),
      })
      if (!res.ok) return
      setVisibility(next)
    } finally {
      setLoading(false)
    }
  }

  const isPublic = visibility === 'public'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isPublic ? 'Make private' : 'Make public'}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors disabled:opacity-50',
        isPublic
          ? 'border-green-300 text-green-700 dark:text-green-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-300'
          : 'border-gray-300 text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 hover:border-green-300',
      )}
    >
      {loading ? (
        <span className="w-3 h-3 border border-current rounded-full border-t-transparent animate-spin" />
      ) : isPublic ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
      {isPublic ? 'Public' : 'Private'}
    </button>
  )
}
