import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'

const APP_NAME = 'HiTech Benchmark'

export function generateTotpSecret() {
  return generateSecret()
}

export function generateTotpUri(secret: string, email: string) {
  return generateURI({ issuer: APP_NAME, label: email, secret })
}

export async function generateTotpQr(secret: string, email: string): Promise<string> {
  const uri = generateTotpUri(secret, email)
  return QRCode.toDataURL(uri)
}

export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    const result = verifySync({ secret, token })
    return result.valid
  } catch {
    return false
  }
}
