import Link from 'next/link'
import { Server } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Server className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white">
                HiTech<span className="text-blue-600">Bench</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Benchmark your VPS or cloud server with one command and compare performance across providers.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Benchmark</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/benchmarks" className="hover:text-gray-900 dark:hover:text-white transition-colors">Recent Results</Link></li>
              <li><Link href="/rankings" className="hover:text-gray-900 dark:hover:text-white transition-colors">Rankings</Link></li>
              <li><Link href="/compare" className="hover:text-gray-900 dark:hover:text-white transition-colors">Compare</Link></li>
              <li><Link href="/providers" className="hover:text-gray-900 dark:hover:text-white transition-colors">Providers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/deals" className="hover:text-gray-900 dark:hover:text-white transition-colors">VPS Deals</Link></li>
              <li><Link href="/api/health" className="hover:text-gray-900 dark:hover:text-white transition-colors">API Status</Link></li>
              <li><Link href="/install" className="hover:text-gray-900 dark:hover:text-white transition-colors">Script</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">Register</Link></li>
              <li><Link href="/admin" className="hover:text-gray-900 dark:hover:text-white transition-colors">Admin</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} HiTech Benchmark. Open source benchmarking platform.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
            benchmark.codelab.vn
          </p>
        </div>
      </div>
    </footer>
  )
}
