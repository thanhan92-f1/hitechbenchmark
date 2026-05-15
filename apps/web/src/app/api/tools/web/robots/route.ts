import { NextRequest, NextResponse } from 'next/server'

interface RobotRule { type: 'Allow' | 'Disallow'; path: string }
interface RobotAgent { userAgent: string; rules: RobotRule[]; crawlDelay?: number }

function parseRobots(text: string) {
  const agents: RobotAgent[] = []
  const sitemaps: string[] = []
  let current: RobotAgent | null = null

  for (const rawLine of text.split('\n')) {
    const line = rawLine.split('#')[0].trim()
    if (!line) { current = null; continue }

    const colonIdx = line.indexOf(':')
    if (colonIdx < 0) continue
    const key = line.slice(0, colonIdx).trim().toLowerCase()
    const val = line.slice(colonIdx + 1).trim()

    if (key === 'user-agent') {
      const existing = agents.find(a => a.userAgent === val)
      if (existing) { current = existing }
      else { current = { userAgent: val, rules: [] }; agents.push(current) }
    } else if (key === 'allow' && current) {
      current.rules.push({ type: 'Allow', path: val || '/' })
    } else if (key === 'disallow' && current) {
      if (val) current.rules.push({ type: 'Disallow', path: val })
    } else if (key === 'crawl-delay' && current) {
      current.crawlDelay = parseFloat(val)
    } else if (key === 'sitemap') {
      sitemaps.push(val)
    }
  }

  return { agents, sitemaps }
}

function testPath(agents: RobotAgent[], userAgent: string, path: string) {
  const agent = agents.find(a => a.userAgent === userAgent) ?? agents.find(a => a.userAgent === '*')
  if (!agent) return { allowed: true, matchedRule: null }

  let matched: RobotRule | null = null
  let matchLen = -1

  for (const rule of agent.rules) {
    const pattern = rule.path.replace(/\*/g, '.*').replace(/\?/, '\\?')
    if (new RegExp('^' + pattern).test(path) && rule.path.length > matchLen) {
      matched = rule
      matchLen = rule.path.length
    }
  }

  return {
    allowed: matched ? matched.type === 'Allow' : true,
    matchedRule: matched,
  }
}

export async function GET(req: NextRequest) {
  let domain = req.nextUrl.searchParams.get('domain')?.trim() ?? ''
  const testPathParam = req.nextUrl.searchParams.get('path')?.trim() ?? null
  const testAgent = req.nextUrl.searchParams.get('agent')?.trim() ?? '*'
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })
  if (!/^https?:\/\//i.test(domain)) domain = `https://${domain}`
  const robotsUrl = new URL('/robots.txt', domain).toString()

  try {
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HiTechBenchmark/1.0)' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, found: false, error: `HTTP ${res.status}` })
    }

    const text = await res.text()
    const { agents, sitemaps } = parseRobots(text)

    const pathTest = testPathParam
      ? { path: testPathParam, agent: testAgent, ...testPath(agents, testAgent, testPathParam) }
      : null

    return NextResponse.json({
      success: true,
      found: true,
      robotsUrl,
      raw: text.slice(0, 8000),
      agents,
      sitemaps,
      pathTest,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
