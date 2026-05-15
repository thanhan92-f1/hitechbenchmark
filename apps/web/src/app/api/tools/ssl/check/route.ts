import { NextRequest, NextResponse } from 'next/server'
import { connect } from 'tls'

function parseDomain(input: string): string {
  return input.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim()
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('domain') ?? ''
  if (!raw) return NextResponse.json({ error: 'domain is required' }, { status: 400 })

  const hostname = parseDomain(raw)
  if (!hostname) return NextResponse.json({ error: 'invalid domain' }, { status: 400 })

  try {
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const socket = connect(
        { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false },
        () => {
          const cert = socket.getPeerCertificate(true)
          const protocol = socket.getProtocol()
          const authorized = socket.authorized
          socket.end()

          if (!cert || !cert.subject) {
            reject(new Error('No certificate returned'))
            return
          }

          resolve({
            valid: authorized,
            protocol,
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysRemaining: Math.floor(
              (new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000,
            ),
            san: (cert.subjectaltname ?? '').split(', ').map(s => s.replace(/^DNS:/, '')),
            fingerprint: cert.fingerprint,
            serialNumber: cert.serialNumber,
          })
        },
      )
      socket.on('error', reject)
      socket.setTimeout(10_000, () => { socket.destroy(); reject(new Error('timeout')) })
    })

    return NextResponse.json({ success: true, hostname, data: result })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 200 },
    )
  }
}
