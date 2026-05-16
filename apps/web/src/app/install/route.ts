import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function findBenchmarkScript() {
  const configuredPath = process.env.BENCHMARK_SCRIPT_PATH
  const candidates = [
    configuredPath,
    // next start from repository root: /opt/hitechbenchmark/scripts/benchmark.sh
    join(process.cwd(), 'scripts', 'benchmark.sh'),
    // pnpm --filter @hitechbenchmark/web exec next start: /opt/hitechbenchmark/apps/web
    join(process.cwd(), '..', '..', 'scripts', 'benchmark.sh'),
    // fallback for other package-root layouts
    join(process.cwd(), '..', 'scripts', 'benchmark.sh'),
  ].filter(Boolean) as string[]

  return candidates.find((path) => existsSync(path))
}

export async function GET() {
  const scriptPath = findBenchmarkScript()

  if (!scriptPath) {
    return new Response('#!/usr/bin/env bash\necho "Benchmark script not found on server." >&2\nexit 1\n', {
      status: 404,
      headers: { 'Content-Type': 'text/x-shellscript; charset=utf-8' },
    })
  }

  const script = readFileSync(scriptPath, 'utf-8')
  const apiUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://benchmark.codelab.vn').replace(/\/$/, '')
  const patchedScript = script.replaceAll('{{API_URL}}', apiUrl)

  return new Response(patchedScript, {
    headers: {
      'Content-Type': 'text/x-shellscript; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Script-Version': process.env.SCRIPT_VERSION || '1.0.0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
