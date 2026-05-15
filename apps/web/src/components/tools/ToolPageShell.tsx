import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolPageShellProps {
  groupId: string
  groupLabel: string
  groupHref: string
  groupColor: string
  toolLabel: string
  description: string
  children: React.ReactNode
}

const colorMap: Record<string, string> = {
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  rose: 'text-rose-600 dark:text-rose-400',
}

export function ToolPageShell({
  groupLabel,
  groupHref,
  groupColor,
  toolLabel,
  description,
  children,
}: ToolPageShellProps) {
  const textClass = colorMap[groupColor] ?? 'text-blue-600 dark:text-blue-400'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/tools" className="hover:text-gray-900 dark:hover:text-white transition-colors">
          Công Cụ
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={groupHref} className={cn('hover:underline', textClass)}>
          {groupLabel}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 dark:text-white font-medium">{toolLabel}</span>
      </nav>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{toolLabel}</h1>
        <p className="text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      {children}
    </div>
  )
}
