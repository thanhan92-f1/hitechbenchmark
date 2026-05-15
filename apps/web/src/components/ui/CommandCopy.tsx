'use client'

import { useState } from 'react'
import { Copy, Check, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandCopyProps {
  command: string
  label?: string
  className?: string
}

export function CommandCopy({ command, label, className }: CommandCopyProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className={cn('group relative', className)}>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Terminal className="w-3 h-3" />
          <span>{label}</span>
        </div>
      )}
      <div className="flex items-center gap-2 bg-gray-900 dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 dark:border-gray-700">
        <code className="flex-1 text-sm text-green-400 font-mono overflow-x-auto whitespace-nowrap">
          {command}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Copy command"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
