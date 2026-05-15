import { NextRequest, NextResponse } from 'next/server'

function all(html: string, attr: string, tag = 'meta') {
  const results: Record<string, string> = {}
  const re = new RegExp(`<${tag}([^>]+)>`, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1]
    const nameMatch = attrs.match(/(?:name|property|http-equiv)=["']([^"']+)["']/i)
    const contentMatch = attrs.match(/content=["']([^"']*?)["']/i)
    if (nameMatch && contentMatch) results[nameMatch[1].toLowerCase()] = contentMatch[1]
    // reversed attribute order
    const contentFirst = attrs.match(/content=["']([^"']*?)["'][^>]*(?:name|property|http-equiv)=["']([^"']+)["']/i)
    if (contentFirst) results[contentFirst[2].toLowerCase()] = contentFirst[1]
  }
  return results
}

function extractLinks(html: string) {
  const links: Array<{ rel: string; href: string; type?: string; sizes?: string }> = []
  const re = /<link([^>]+)>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1]
    const rel = attrs.match(/rel=["']([^"']+)["']/i)?.[1]
    const href = attrs.match(/href=["']([^"']+)["']/i)?.[1]
    const type = attrs.match(/type=["']([^"']+)["']/i)?.[1]
    const sizes = attrs.match(/sizes=["']([^"']+)["']/i)?.[1]
    if (rel && href) links.push({ rel, href, ...(type && { type }), ...(sizes && { sizes }) })
  }
  return links
}

function extractJsonLd(html: string) {
  const results: unknown[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try { results.push(JSON.parse(m[1].trim())) } catch { /* skip invalid */ }
  }
  return results
}

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url')?.trim() ?? ''
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HiTechBenchmark/1.0)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return NextResponse.json({ success: false, error: `HTTP ${res.status}` })
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html')) return NextResponse.json({ success: false, error: 'Not an HTML page' })

    const html = await res.text()
    const metas = all(html)
    const links = extractLinks(html)
    const jsonld = extractJsonLd(html)

    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null
    const charset = html.match(/<meta[^>]+charset=["']?([^"'>\s]+)/i)?.[1] ?? null
    const canonical = links.find(l => l.rel === 'canonical')?.href ?? null
    const favicons = links.filter(l => l.rel.includes('icon'))

    const og: Record<string, string> = {}
    const twitter: Record<string, string> = {}
    const standard: Record<string, string> = {}

    for (const [k, v] of Object.entries(metas)) {
      if (k.startsWith('og:')) og[k] = v
      else if (k.startsWith('twitter:')) twitter[k] = v
      else standard[k] = v
    }

    return NextResponse.json({
      success: true,
      url,
      title,
      charset,
      canonical,
      standard,
      og,
      twitter,
      favicons,
      jsonld,
      htmlLength: html.length,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
