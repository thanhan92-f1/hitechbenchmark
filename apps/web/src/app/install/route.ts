import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const userAgent = request.headers.get('user-agent') || ''
  const isBash = userAgent.toLowerCase().includes('curl') || userAgent.toLowerCase().includes('wget')

  // Read the versioned benchmark script
  let script: string
  try {
    script = readFileSync(join(process.cwd(), 'scripts', 'benchmark.sh'), 'utf-8')
  } catch {
    return new Response('#!/bin/bash\necho "Script not found. Please contact support."\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Inject the API URL into the script
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://benchmark.codelab.vn'
  const patchedScript = script.replace('{{API_URL}}', apiUrl)

  return new Response(patchedScript, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Script-Version': process.env.SCRIPT_VERSION || '1.0.0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
