import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { db } from './db'
import { NONCE_TTL_SECONDS, ANTI_FAKE_LIMITS } from '@hitechbenchmark/shared'

const SECRET = process.env.BENCHMARK_SIGNING_SECRET!

export function signPayload(data: object, nonce: string, timestamp: number): string {
  const message = JSON.stringify({ ...data, nonce, timestamp })
  return createHmac('sha256', SECRET).update(message).digest('hex')
}

export function verifySignature(
  data: object,
  nonce: string,
  timestamp: number,
  signature: string,
): boolean {
  const expected = signPayload(data, nonce, timestamp)
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

export function isTimestampValid(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const delta = now - timestamp
  return (
    delta >= ANTI_FAKE_LIMITS.minTimestampDeltaSeconds &&
    delta <= ANTI_FAKE_LIMITS.maxTimestampDeltaSeconds
  )
}

export async function checkAndConsumeNonce(nonce: string): Promise<boolean> {
  const expiresAt = new Date(Date.now() + NONCE_TTL_SECONDS * 1000)

  try {
    // Clean up expired nonces first
    await db.nonce.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    // Try to create — if nonce already exists, this will throw unique constraint
    await db.nonce.create({
      data: { value: nonce, expiresAt },
    })
    return true
  } catch {
    return false
  }
}

export function generatePrivateToken(): string {
  return randomBytes(32).toString('hex')
}

export function generatePublicSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}
