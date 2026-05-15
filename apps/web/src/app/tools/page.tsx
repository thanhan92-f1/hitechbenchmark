import Link from 'next/link'
import { toolGroups } from '@/lib/tools-data'
import { Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Công Cụ Miễn Phí</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          {toolGroups.reduce((sum, g) => sum + g.tools.length, 0)}+ công cụ cho developer:
          SSL, DNS, IP, mã hóa, định dạng và nhiều hơn nữa — tất cả hoàn toàn miễn phí.
        </p>
      </div>

      {/* Groups */}
      <div className="space-y-12">
        {toolGroups.map((group) => {
          const GroupIcon = group.icon
          return (
            <section key={group.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', group.bgClass)}>
                    <GroupIcon className={cn('w-4 h-4', group.textClass)} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{group.label}</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                    ({group.tools.length} công cụ)
                  </span>
                </div>
                <Link
                  href={group.href}
                  className={cn('text-sm font-medium hover:underline', group.textClass)}
                >
                  Xem tất cả →
                </Link>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{group.description}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {group.tools.map((tool) => {
                  const ToolIcon = tool.icon
                  return (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className={cn(
                        'group flex items-start gap-3 p-4 rounded-xl border bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm',
                        group.borderClass,
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', group.bgClass)}>
                        <ToolIcon className={cn('w-4 h-4', group.textClass)} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tool.label}
                          </span>
                          {tool.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
