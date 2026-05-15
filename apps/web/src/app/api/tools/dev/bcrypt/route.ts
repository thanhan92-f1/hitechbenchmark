import { NextRequest, NextResponse } from 'next/server'
import { hash, compare } from 'bcryptjs'
import { z } from 'zod'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('hash'), password: z.string().min(1).max(200), rounds: z.number().int().min(4).max(14).default(12) }),
  z.object({ action: z.literal('verify'), password: z.string().min(1).max(200), hash: z.string().min(1) }),
])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const data = parsed.data
  if (data.action === 'hash') {
    const hashed = await hash(data.password, data.rounds)
    return NextResponse.json({ hash: hashed })
  } else {
    const match = await compare(data.password, data.hash).catch(() => false)
    return NextResponse.json({ match })
  }
}
