'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Map, Loader2, ExternalLink, FileText, Calendar, RefreshCw } from 'lucide-react'

interface SitemapUrl { loc: string; lastmod: string | null; changefreq: string | null; priority: string | null }
interface SitemapResult {
  url: string; type: 'urlset' | 'sitemapindex'; urlCount: number
  urls: SitemapUrl[]; sitemaps?: Array<{ loc: string; lastmod: string | null }>
}

export default function SitemapPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SitemapResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const check = async () => {
    if (!domain.trim()) return
    setLoading(true); setResult(null); setError(null); setShowAll(false)
    try {
      const res = await fetch(`/api/tools/web/sitemap?domain=${encodeURIComponent(domain)}`)
      const json = await res.json()
      if (json.success) setResult(json)
      else setError(json.error ?? 'Failed')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const displayUrls = result?.urls ?? []
  const shown = showAll ? displayUrls : displayUrls.slice(0, 20)

  return (
    <ToolPageShell
      groupId="web"
      groupLabel="Web & SEO"
      groupHref="/tools/web"
      groupColor="red"
      toolLabel="Sitemap Check"
      description="Tìm và validate XML sitemap của website. Liệt kê tất cả URLs, lastmod dates, và sitemap indexes."
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button onClick={check} disabled={loading || !domain.trim()} className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
            {loading ? 'Fetching…' : 'Find Sitemap'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{result.urlCount}</div>
                <div className="text-xs text-gray-500 mt-0.5">{result.type === 'sitemapindex' ? 'Sub-sitemaps' : 'URLs'}</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-sm font-bold text-gray-800 dark:text-white uppercase">{result.type}</div>
                <div className="text-xs text-gray-500 mt-0.5">Type</div>
              </div>
              {result.urls.some(u => u.lastmod) && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-sm font-bold text-gray-800 dark:text-white">
                    {result.urls.filter(u => u.lastmod).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">With lastmod</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <ExternalLink className="w-3 h-3" /> {result.url}
              </a>
            </div>

            {/* Sitemap index links */}
            {result.type === 'sitemapindex' && result.sitemaps && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sub-sitemaps</h3>
                {result.sitemaps.map((sm, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <a href={sm.loc} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate flex items-center gap-1">
                      <FileText className="w-3 h-3 shrink-0" /> {sm.loc}
                    </a>
                    {sm.lastmod && <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">{sm.lastmod}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* URL list */}
            {displayUrls.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  URLs {displayUrls.length > 20 && `(showing ${shown.length} of ${displayUrls.length})`}
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] text-xs font-semibold text-gray-500 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <span>URL</span><span className="px-2">Last Modified</span><span>Priority</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {shown.map((u, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <a href={u.loc} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 shrink-0" /> {u.loc}
                        </a>
                        <span className="text-xs text-gray-400 px-4 whitespace-nowrap flex items-center gap-1">
                          {u.lastmod ? <><Calendar className="w-3 h-3" />{u.lastmod}</> : '—'}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{u.priority ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {displayUrls.length > 20 && !showAll && (
                  <button onClick={() => setShowAll(true)} className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <RefreshCw className="w-3 h-3" /> Show all {displayUrls.length} URLs
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
