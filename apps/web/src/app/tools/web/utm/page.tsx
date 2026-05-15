'use client'

import { useState } from 'react'
import { ToolPageShell } from '@/components/tools/ToolPageShell'
import { Copy, Check } from 'lucide-react'

export default function UTMBuilderPage() {
  const [url, setUrl] = useState('')
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('')
  const [campaign, setCampaign] = useState('')
  const [term, setTerm] = useState('')
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  const utmUrl = (() => {
    if (!url.trim()) return ''
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`)
      if (source) u.searchParams.set('utm_source', source)
      if (medium) u.searchParams.set('utm_medium', medium)
      if (campaign) u.searchParams.set('utm_campaign', campaign)
      if (term) u.searchParams.set('utm_term', term)
      if (content) u.searchParams.set('utm_content', content)
      return u.toString()
    } catch {
      return ''
    }
  })()

  const copy = () => {
    if (!utmUrl) return
    navigator.clipboard.writeText(utmUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const PRESETS = [
    { label: 'Email Newsletter', source: 'email', medium: 'email', campaign: 'newsletter' },
    { label: 'Google Ads', source: 'google', medium: 'cpc', campaign: 'brand' },
    { label: 'Facebook Ads', source: 'facebook', medium: 'paid-social', campaign: 'awareness' },
    { label: 'Organic Social', source: 'twitter', medium: 'social', campaign: 'organic' },
  ]

  return (
    <ToolPageShell groupId="web" groupLabel="Web & SEO" groupHref="/tools/web" groupColor="red"
      toolLabel="UTM URL Builder" description="Build and parse UTM tracking URLs for Google Analytics campaigns.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destination URL *</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/page"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Presets */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick presets:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { setSource(p.source); setMedium(p.medium); setCampaign(p.campaign) }}
                className="px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-colors text-gray-700 dark:text-gray-300">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: 'Campaign Source *', value: source, set: setSource, placeholder: 'google, email, twitter', key: 'utm_source' },
            { label: 'Campaign Medium *', value: medium, set: setMedium, placeholder: 'cpc, email, social', key: 'utm_medium' },
            { label: 'Campaign Name *', value: campaign, set: setCampaign, placeholder: 'brand, product, promo', key: 'utm_campaign' },
            { label: 'Campaign Term', value: term, set: setTerm, placeholder: 'keyword (paid search)', key: 'utm_term' },
            { label: 'Campaign Content', value: content, set: setContent, placeholder: 'ad variant, button text', key: 'utm_content' },
          ].map(({ label, value, set, placeholder, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
              <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>

        {utmUrl && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Generated URL</p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-mono text-xs text-gray-900 dark:text-white break-all">
                {utmUrl}
              </div>
              <button onClick={copy} className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  )
}
