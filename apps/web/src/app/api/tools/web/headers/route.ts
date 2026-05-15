import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url')?.trim() ?? ''
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  try {
    const redirects: { url: string; status: number }[] = []
    let current = url

    for (let i = 0; i < 10; i++) {
      const res = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'User-Agent': 'HiTechBenchmark/1.0 HeaderChecker (+https://benchmark.codelab.vn)',
        },
      })

      const headers: Record<string, string> = {}
      res.headers.forEach((value, key) => { headers[key] = value })

      redirects.push({ url: current, status: res.status })

      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        const loc = res.headers.get('location')!
        current = loc.startsWith('http') ? loc : new URL(loc, current).toString()
        continue
      }

      return NextResponse.json({
        success: true,
        finalUrl: current,
        status: res.status,
        statusText: res.statusText,
        headers,
        redirects,
      })
    }

    return NextResponse.json({ success: false, error: 'Too many redirects' })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
