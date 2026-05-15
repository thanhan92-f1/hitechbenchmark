'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Search, Loader2, Globe, Twitter, Image as ImageIcon, Link as LinkIcon, FileJson } from 'lucide-react'

interface MetaResult {
  url: string; title: string | null; charset: string | null; canonical: string | null
  standard: Record<string, string>; og: Record<string, string>; twitter: Record<string, string>
  favicons: Array<{ rel: string; href: string; type?: string; sizes?: string }>
  jsonld: unknown[]; htmlLength: number
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="py-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap w-48">{label}</td>
      <td className="py-2 text-xs text-gray-800 dark:text-gray-200 break-all font-mono">{value}</td>
    </tr>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Icon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

export default function MetaTagPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MetaResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!url.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch(`/api/tools/web/meta?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.success) setResult(json)
      else setError(json.error ?? 'Failed to fetch page')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <ToolPageShell
      groupId="web"
      groupLabel="Web & SEO"
      groupHref="/tools/web"
      groupColor="red"
      toolLabel="Meta Tag Inspector"
      description="Xem tất cả meta tags của bất kỳ trang web nào: Open Graph, Twitter Card, JSON-LD, favicons."
    >
      <div className="space-y-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button onClick={check} disabled={loading || !url.trim()} className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Scanning…' : 'Inspect'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'HTML Size', value: `${(result.htmlLength / 1024).toFixed(1)} KB` },
                { label: 'OG Tags', value: String(Object.keys(result.og).length) },
                { label: 'Twitter Tags', value: String(Object.keys(result.twitter).length) },
                { label: 'Favicons', value: String(result.favicons.length) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="text-xl font-bold text-gray-800 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Standard */}
            <Section title="Standard Meta Tags" icon={Globe}>
              <table className="w-full">
                <tbody>
                  <Row label="title" value={result.title} />
                  <Row label="charset" value={result.charset} />
                  <Row label="canonical" value={result.canonical} />
                  {Object.entries(result.standard).map(([k, v]) => <Row key={k} label={k} value={v} />)}
                </tbody>
              </table>
            </Section>

            {/* Open Graph */}
            {Object.keys(result.og).length > 0 && (
              <Section title="Open Graph" icon={ImageIcon}>
                <table className="w-full">
                  <tbody>
                    {Object.entries(result.og).map(([k, v]) => <Row key={k} label={k} value={v} />)}
                  </tbody>
                </table>
                {result.og['og:image'] && (
                  <div className="py-3">
                    <img src={result.og['og:image']} alt="OG Image" className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </Section>
            )}

            {/* Twitter */}
            {Object.keys(result.twitter).length > 0 && (
              <Section title="Twitter Card" icon={Twitter}>
                <table className="w-full">
                  <tbody>
                    {Object.entries(result.twitter).map(([k, v]) => <Row key={k} label={k} value={v} />)}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Favicons */}
            {result.favicons.length > 0 && (
              <Section title="Favicons & Icons" icon={LinkIcon}>
                <table className="w-full">
                  <tbody>
                    {result.favicons.map((f, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 pr-4 text-xs font-medium text-gray-500 w-32">{f.rel}{f.sizes ? ` (${f.sizes})` : ''}</td>
                        <td className="py-2 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">{f.href}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* JSON-LD */}
            {result.jsonld.length > 0 && (
              <Section title="JSON-LD Schema" icon={FileJson}>
                {result.jsonld.map((schema, i) => (
                  <pre key={i} className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto my-2">
                    {JSON.stringify(schema, null, 2)}
                  </pre>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
