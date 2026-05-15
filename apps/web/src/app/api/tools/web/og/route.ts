import { NextRequest, NextResponse } from 'next/server'

function extractMeta(html: string) {
  const getMeta = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)`, 'i'))
      ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'))
    return m?.[1] ?? null
  }

  return {
    title: getMeta('og:title') ?? html.match(/<title[^>]*>([^<]+)/i)?.[1]?.trim() ?? null,
    description: getMeta('og:description') ?? getMeta('description'),
    image: getMeta('og:image'),
    url: getMeta('og:url'),
    siteName: getMeta('og:site_name'),
    type: getMeta('og:type'),
    twitterCard: getMeta('twitter:card'),
    twitterTitle: getMeta('twitter:title'),
    twitterDescription: getMeta('twitter:description'),
    twitterImage: getMeta('twitter:image'),
  }
}

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url')?.trim() ?? ''
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HiTechBenchmark/1.0; +https://benchmark.codelab.vn)',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return NextResponse.json({ success: false, error: `HTTP ${res.status}` })

    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html')) return NextResponse.json({ success: false, error: 'Not an HTML page' })

    const html = await res.text()
    const data = extractMeta(html)

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
