import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function parseSubject(str: string) {
  const fields: Record<string, string> = {}
  for (const part of str.split('\n')) {
    const eq = part.indexOf('=')
    if (eq > 0) fields[part.slice(0, eq)] = part.slice(eq + 1)
  }
  return fields
}

function parseSan(san: string | null | undefined) {
  if (!san) return []
  return san.split(', ').map(s => {
    const colon = s.indexOf(':')
    return colon > 0 ? { type: s.slice(0, colon), value: s.slice(colon + 1) } : { type: 'Unknown', value: s }
  })
}

export async function POST(req: NextRequest) {
  const { pem } = await req.json()
  if (!pem?.trim()) return NextResponse.json({ error: 'pem is required' }, { status: 400 })

  // Detect PEM type
  const type = pem.includes('BEGIN CERTIFICATE REQUEST') ? 'csr'
    : pem.includes('BEGIN CERTIFICATE') ? 'certificate'
    : 'unknown'

  if (type === 'unknown') {
    return NextResponse.json({ success: false, error: 'Unrecognized PEM type. Expected CERTIFICATE or CERTIFICATE REQUEST.' })
  }

  try {
    if (type === 'certificate') {
      const cert = new crypto.X509Certificate(pem)
      const sub = parseSubject(cert.subject)
      const iss = parseSubject(cert.issuer)
      const validFrom = cert.validFrom
      const validTo = cert.validTo
      const daysLeft = Math.floor((new Date(validTo).getTime() - Date.now()) / 86400000)
      const san = parseSan(cert.subjectAltName)
      const pk = cert.publicKey
      const keyBits = pk.asymmetricKeyDetails?.modulusLength
        ?? (pk.asymmetricKeyDetails as { prime?: Buffer })?.prime?.length
        ?? null

      return NextResponse.json({
        success: true,
        type: 'certificate',
        subject: sub,
        issuer: iss,
        validity: { from: validFrom, to: validTo, daysLeft, expired: daysLeft < 0 },
        serialNumber: cert.serialNumber,
        fingerprint: cert.fingerprint,
        fingerprint256: cert.fingerprint256,
        subjectAltNames: san,
        keyUsage: cert.keyUsage ?? null,
        publicKey: { type: pk.type, bits: keyBits },
        isCA: cert.ca,
        raw: pem.trim(),
      })
    }

    // CSR: extract public key info
    const pubKey = crypto.createPublicKey(pem)
    const keyBits = pubKey.asymmetricKeyDetails?.modulusLength ?? null

    // Extract subject from CSR via DER parsing (basic approach)
    const b64 = pem.replace(/-----.*?-----\n?/g, '').replace(/\s/g, '')
    const der = Buffer.from(b64, 'base64')

    // Try to extract CN from DER: look for printable string after OID 55 04 03
    let cn: string | null = null
    for (let i = 0; i < der.length - 5; i++) {
      if (der[i] === 0x55 && der[i + 1] === 0x04 && der[i + 2] === 0x03) {
        const valTag = der[i + 3]
        if (valTag === 0x0c || valTag === 0x13 || valTag === 0x16) {
          const len = der[i + 4]
          cn = der.slice(i + 5, i + 5 + len).toString('utf8')
        }
      }
    }

    return NextResponse.json({
      success: true,
      type: 'csr',
      subject: cn ? { CN: cn } : {},
      publicKey: { type: pubKey.type, bits: keyBits },
      raw: pem.trim(),
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message })
  }
}
