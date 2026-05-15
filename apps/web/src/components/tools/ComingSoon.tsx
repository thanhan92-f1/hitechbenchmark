import Link from 'next/link'
import { Clock } from 'lucide-react'

interface Props {
  groupId: string
  groupLabel: string
  groupHref: string
  groupColor: string
  toolLabel: string
  description: string
}

const colorMap: Record<string, string> = {
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  rose: 'text-rose-600 dark:text-rose-400',
}

export function ComingSoon({ groupId, groupLabel, groupHref, groupColor, toolLabel, description }: Props) {
  const textClass = colorMap[groupColor] ?? 'text-blue-600 dark:text-blue-400'
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
        <Clock className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{toolLabel}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <Clock className="w-4 h-4" />
        Đang phát triển — Coming Soon
      </div>
      <div className="mt-4">
        <Link href={groupHref} className={`text-sm hover:underline ${textClass}`}>
          ← Quay lại {groupLabel}
        </Link>
      </div>
    </div>
  )
}
