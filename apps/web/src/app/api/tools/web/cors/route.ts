import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url')?.trim() ?? ''
  const origin = req.nextUrl.searchParams.get('origin')?.trim() || 'https://test.example.com'
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  try {
    // Send preflight-like OPTIONS request
    const optRes = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
        'User-Agent': 'Mozilla/5.0 (compatible; HiTechBenchmark/1.0)',
      },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    // Also do a simple GET to capture actual CORS headers
    const getRes = await fetch(url, {
      headers: {
        Origin: origin,
        'User-Agent': 'Mozilla/5.0 (compatible; HiTechBenchmark/1.0)',
      },
      signal: AbortSignal.timeout(10_000),
    })

    function headerMap(res: Response) {
      const h: Record<string, string> = {}
      res.headers.forEach((v, k) => { h[k] = v })
      return h
    }

    const getHeaders = headerMap(getRes)
    const optHeaders = optRes ? headerMap(optRes) : {}

    const allowOrigin = getHeaders['access-control-allow-origin'] ?? optHeaders['access-control-allow-origin'] ?? null
    const allowMethods = getHeaders['access-control-allow-methods'] ?? optHeaders['access-control-allow-methods'] ?? null
    const allowHeaders = getHeaders['access-control-allow-headers'] ?? optHeaders['access-control-allow-headers'] ?? null
    const allowCredentials = getHeaders['access-control-allow-credentials'] ?? optHeaders['access-control-allow-credentials'] ?? null
    const exposeHeaders = getHeaders['access-control-expose-headers'] ?? null
    const maxAge = getHeaders['access-control-max-age'] ?? optHeaders['access-control-max-age'] ?? null
    const vary = getHeaders['vary'] ?? null

    const corsEnabled = !!allowOrigin
    const wildcardOrigin = allowOrigin === '*'
    const credentialsCorsIssue = wildcardOrigin && allowCredentials === 'true'

    return NextResponse.json({
      success: true,
      url,
      testedOrigin: origin,
      corsEnabled,
      wildcardOrigin,
      credentialsCorsIssue,
      headers: {
        'access-control-allow-origin': allowOrigin,
        'access-control-allow-methods': allowMethods,
        'access-control-allow-headers': allowHeaders,
        'access-control-allow-credentials': allowCredentials,
        'access-control-expose-headers': exposeHeaders,
        'access-control-max-age': maxAge,
        vary,
      },
      httpStatus: getRes.status,
      optionsStatus: optRes?.status ?? null,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
