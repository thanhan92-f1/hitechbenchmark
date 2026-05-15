'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Loader2 } from 'lucide-react'

interface OGData {
  title?: string
  description?: string
  image?: string
  url?: string
  siteName?: string
  type?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

export default function OpenGraphPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [og, setOg] = useState<OGData | null>(null)
  const [error, setError] = useState('')

  const check = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setOg(null)
    try {
      const target = url.startsWith('http') ? url : `https://${url}`
      const res = await fetch(`/api/tools/web/og?url=${encodeURIComponent(target)}`)
      const json = await res.json()
      if (json.success) setOg(json.data)
      else setError(json.error ?? 'Failed to fetch')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPageShell groupId="web" groupLabel="Web & SEO" groupHref="/tools/web" groupColor="red"
      toolLabel="OpenGraph Preview" description="Preview how your page will appear when shared on Twitter/X, Facebook, LinkedIn and other social networks.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={check} disabled={loading || !url.trim()} className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Preview
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg text-sm text-red-600">{error}</div>}

        {og && (
          <div className="space-y-6">
            {/* Facebook / OG Preview */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Facebook / LinkedIn</p>
              <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden max-w-md">
                {og.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={og.image} alt="OG image" className="w-full h-52 object-cover" />
                )}
                <div className="p-3 bg-gray-50 dark:bg-gray-900">
                  <div className="text-xs text-gray-400 uppercase mb-1">{og.siteName ?? new URL(url.startsWith('http') ? url : `https://${url}`).hostname}</div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{og.title ?? 'No title'}</div>
                  {og.description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{og.description}</div>}
                </div>
              </div>
            </div>

            {/* Twitter Card Preview */}
            {og.twitterCard && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Twitter / X — {og.twitterCard}</p>
                <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden max-w-md">
                  {og.twitterImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={og.twitterImage} alt="Twitter card" className="w-full h-52 object-cover" />
                  )}
                  <div className="p-3 bg-gray-50 dark:bg-gray-900">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{og.twitterTitle ?? og.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{og.twitterDescription ?? og.description}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Raw tags */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Meta Tags Found</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {Object.entries(og).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex gap-3 px-4 py-2">
                    <span className="text-xs font-mono text-gray-400 w-40 shrink-0">{k}</span>
                    <span className="text-xs text-gray-900 dark:text-white break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
