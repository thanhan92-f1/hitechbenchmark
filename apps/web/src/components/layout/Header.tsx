'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { Server, BarChart2, GitCompare, Tag, Search, Menu, X, ChevronDown, Wrench, Info } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toolGroups } from '@/lib/tools-data'

const navLinks = [
  { href: '/benchmarks', label: 'Recent', icon: Server },
  { href: '/rankings', label: 'Rankings', icon: BarChart2 },
  { href: '/providers', label: 'Providers', icon: BarChart2 },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/deals', label: 'Deals', icon: Tag },
  { href: '/search', label: 'Search', icon: Search },
]

const PREVIEW_TOOLS = 4

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setToolsOpen(false)
    setMobileOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Server className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-gray-900 dark:text-white">
              HiTech<span className="text-blue-600">Bench</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
              >
                {label}
              </Link>
            ))}

            {/* Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setToolsOpen(v => !v)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith('/tools')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
              >
                <Wrench className="w-3.5 h-3.5" />
                Công Cụ
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', toolsOpen && 'rotate-180')} />
              </button>

              {toolsOpen && (
                <div className="absolute left-0 top-full mt-1 w-[720px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-4 grid grid-cols-3 gap-4">
                  {toolGroups.map((group) => {
                    const GroupIcon = group.icon
                    return (
                      <div key={group.id}>
                        <Link
                          href={group.href}
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2 hover:opacity-80 transition-opacity',
                            group.textClass,
                          )}
                        >
                          <GroupIcon className="w-3.5 h-3.5" />
                          {group.label}
                        </Link>
                        <ul className="space-y-0.5">
                          {group.tools.slice(0, PREVIEW_TOOLS).map((tool) => (
                            <li key={tool.id}>
                              <Link
                                href={tool.href}
                                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
                              >
                                {tool.label}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href={group.href}
                              className={cn(
                                'block text-xs font-medium px-2 py-1 hover:underline',
                                group.textClass,
                              )}
                            >
                              Xem tất cả →
                            </Link>
                          </li>
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* About */}
            <Link
              href="/about"
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === '/about'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Info className="w-3.5 h-3.5" />
              Về Chúng Tôi
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Run Benchmark
            </Link>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-3 border-t border-gray-200 dark:border-gray-800 mt-2 pt-2 max-h-[80vh] overflow-y-auto">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  pathname.startsWith(href)
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            {/* Mobile Tools */}
            <button
              onClick={() => setMobileToolsOpen(v => !v)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                pathname.startsWith('/tools')
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Wrench className="w-4 h-4" />
              <span className="flex-1 text-left">Công Cụ</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', mobileToolsOpen && 'rotate-180')} />
            </button>

            {mobileToolsOpen && (
              <div className="pl-7 space-y-1 mb-1">
                {toolGroups.map((group) => (
                  <div key={group.id}>
                    <Link
                      href={group.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn('block text-xs font-semibold uppercase tracking-wide px-2 py-1', group.textClass)}
                    >
                      {group.label}
                    </Link>
                    {group.tools.slice(0, 3).map(tool => (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        onClick={() => setMobileOpen(false)}
                        className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1"
                      >
                        {tool.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                pathname === '/about'
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Info className="w-4 h-4" />
              Về Chúng Tôi
            </Link>

            <div className="flex gap-2 mt-3 px-1">
              <Link
                href="/dashboard"
                className="flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white"
                onClick={() => setMobileOpen(false)}
              >
                Run Benchmark
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
