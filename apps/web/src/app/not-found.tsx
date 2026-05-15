import Link from 'next/link'
import { Server } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <Server className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
        Page not found
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}
