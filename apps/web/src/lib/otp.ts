import Redis from 'ioredis'
import { randomInt } from 'crypto'

let _redis: Redis | null = null
function getRedis() {
  if (!_redis) _redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null, lazyConnect: true })
  return _redis
}

export function generateOtp(digits = 6) {
  const min = Math.pow(10, digits - 1)
  const max = Math.pow(10, digits) - 1
  return randomInt(min, max + 1).toString()
}

export async function storeOtp(key: string, otp: string, ttlSeconds = 600) {
  const r = getRedis()
  await r.set(`otp:${key}`, otp, 'EX', ttlSeconds)
}

export async function verifyOtp(key: string, otp: string): Promise<boolean> {
  const r = getRedis()
  const stored = await r.get(`otp:${key}`)
  if (!stored || stored !== otp) return false
  await r.del(`otp:${key}`)
  return true
}

export async function hasOtpCooldown(key: string): Promise<number> {
  const r = getRedis()
  const ttl = await r.ttl(`otp:${key}`)
  // Require at least 8 minutes remaining before allowing resend (2 min cooldown window)
  return ttl > 480 ? ttl - 480 : 0
}
