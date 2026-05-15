import { NextRequest, NextResponse } from 'next/server'

function extractAll(xml: string, tag: string) {
  const results: string[] = []
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim())
  return results
}

function getTag(xml: string, tag: string) {
  return xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'))?.[1]?.trim() ?? null
}

function parseSitemapUrls(xml: string, limit = 200) {
  const urlBlocks = extractAll(xml, 'url').slice(0, limit)
  return urlBlocks.map(block => ({
    loc: getTag(block, 'loc') ?? '',
    lastmod: getTag(block, 'lastmod'),
    changefreq: getTag(block, 'changefreq'),
    priority: getTag(block, 'priority'),
  })).filter(u => u.loc)
}

function parseSitemapIndex(xml: string) {
  const sitemapBlocks = extractAll(xml, 'sitemap')
  return sitemapBlocks.map(block => ({
    loc: getTag(block, 'loc') ?? '',
    lastmod: getTag(block, 'lastmod'),
  })).filter(s => s.loc)
}

async function fetchSitemap(url: string, depth = 0): Promise<{
  url: string; type: string; urlCount: number; urls: ReturnType<typeof parseSitemapUrls>;
  sitemaps?: ReturnType<typeof parseSitemapIndex>; error?: string
}> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HiTechBenchmark/1.0)' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { url, type: 'error', urlCount: 0, urls: [], error: `HTTP ${res.status}` }

    const xml = await res.text()
    const isSitemapIndex = /<sitemapindex/i.test(xml)

    if (isSitemapIndex) {
      const sitemaps = parseSitemapIndex(xml)
      return { url, type: 'sitemapindex', urlCount: sitemaps.length, urls: [], sitemaps }
    }

    const urls = parseSitemapUrls(xml)
    return { url, type: 'urlset', urlCount: urls.length, urls }
  } catch (err) {
    return { url, type: 'error', urlCount: 0, urls: [], error: (err as Error).message }
  }
}

export async function GET(req: NextRequest) {
  let domain = req.nextUrl.searchParams.get('domain')?.trim() ?? ''
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })
  if (!/^https?:\/\//i.test(domain)) domain = `https://${domain}`

  const candidates = [
    new URL('/sitemap.xml', domain).toString(),
    new URL('/sitemap_index.xml', domain).toString(),
    new URL('/sitemap/sitemap.xml', domain).toString(),
  ]

  // Try robots.txt for sitemap declaration first
  try {
    const robotsRes = await fetch(new URL('/robots.txt', domain).toString(), {
      signal: AbortSignal.timeout(5_000),
    })
    if (robotsRes.ok) {
      const text = await robotsRes.text()
      const m = text.match(/^Sitemap:\s*(.+)$/im)
      if (m) candidates.unshift(m[1].trim())
    }
  } catch { /* ignore */ }

  for (const candidateUrl of candidates) {
    const result = await fetchSitemap(candidateUrl)
    if (result.type !== 'error') {
      return NextResponse.json({ success: true, ...result })
    }
  }

  return NextResponse.json({ success: false, error: 'No sitemap found at common locations' })
}
