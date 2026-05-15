import Link from 'next/link'
import { getToolGroup } from '@/lib/tools-data'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default function VNGroupPage() {
  const group = getToolGroup('vn')!
  const GroupIcon = group.icon

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/tools" className="hover:text-gray-900 dark:hover:text-white">Công Cụ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 dark:text-white font-medium">{group.label}</span>
      </nav>

      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', group.bgClass)}>
          <GroupIcon className={cn('w-5 h-5', group.textClass)} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.labelVi ?? group.label}</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{group.description}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {group.tools.map((tool) => {
          const ToolIcon = tool.icon
          return (
            <Link key={tool.id} href={tool.href} className={cn('group flex items-start gap-4 p-5 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-sm transition-all', group.borderClass)}>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', group.bgClass)}>
                <ToolIcon className={cn('w-5 h-5', group.textClass)} />
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{tool.label}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tool.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
