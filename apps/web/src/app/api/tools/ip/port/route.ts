import { NextRequest, NextResponse } from 'next/server'
import { createConnection } from 'net'

const DEFAULT_PORTS = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 465, service: 'SMTPS' },
  { port: 587, service: 'SMTP TLS' },
  { port: 993, service: 'IMAPS' },
  { port: 995, service: 'POP3S' },
  { port: 3306, service: 'MySQL' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 8080, service: 'HTTP Alt' },
  { port: 8443, service: 'HTTPS Alt' },
  { port: 27017, service: 'MongoDB' },
]

function checkPort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise(resolve => {
    const socket = createConnection({ host, port })
    socket.setTimeout(timeoutMs)
    socket.on('connect', () => { socket.destroy(); resolve(true) })
    socket.on('error', () => resolve(false))
    socket.on('timeout', () => { socket.destroy(); resolve(false) })
  })
}

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host')?.trim()
  const portsParam = req.nextUrl.searchParams.get('ports')

  if (!host) return NextResponse.json({ error: 'host is required' }, { status: 400 })

  const ports = portsParam
    ? portsParam.split(',').map(p => {
        const num = parseInt(p.trim())
        const def = DEFAULT_PORTS.find(d => d.port === num)
        return { port: num, service: def?.service ?? 'Custom' }
      }).filter(p => !isNaN(p.port) && p.port > 0 && p.port <= 65535)
    : DEFAULT_PORTS

  if (ports.length > 25) return NextResponse.json({ error: 'Max 25 ports per request' }, { status: 400 })

  try {
    const results = await Promise.all(
      ports.map(async ({ port, service }) => ({
        port,
        service,
        open: await checkPort(host, port),
      })),
    )

    return NextResponse.json({ success: true, host, results })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
