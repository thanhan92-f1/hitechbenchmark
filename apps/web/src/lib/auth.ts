import NextAuth, { CredentialsSignin, type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { createHash } from 'crypto'
import { db } from './db'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

class EmailNotVerifiedError extends CredentialsSignin {
  code = 'EMAIL_NOT_VERIFIED'
}

const config: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST !== 'false',
  providers: [
    // OAuth providers are included only when credentials are configured to prevent
    // NextAuth from throwing a configuration error when env vars are absent.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            password: true,
            role: true,
            isActive: true,
            emailVerified: true,
            isEmailVerified: true,
            mfaTotpEnabled: true,
            mfaEmailEnabled: true,
          },
        })

        if (!user || !user.isActive) return null
        if (!user.password) return null

        let passwordMatch = false
        if (user.password.startsWith('$2')) {
          passwordMatch = await compare(parsed.data.password, user.password)
        } else {
          // Legacy SHA-256 hash support (e.g. seed-created admin account)
          const sha256 = createHash('sha256').update(parsed.data.password).digest('hex')
          passwordMatch = sha256 === user.password
        }

        if (!passwordMatch) return null

        const legacySeedAdmin = user.email === 'admin@hitechbenchmark.com' && user.role === 'super_admin'
        const emailVerified = user.isEmailVerified || Boolean(user.emailVerified)

        if (!emailVerified) {
          if (!legacySeedAdmin) {
            throw new EmailNotVerifiedError()
          }

          await db.user.update({
            where: { id: user.id },
            data: {
              isEmailVerified: true,
              emailVerified: new Date(),
              emailVerifiedAt: new Date(),
            },
          })
        }

        const mfaRequired = user.mfaTotpEnabled || user.mfaEmailEnabled

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          mfaRequired,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') {
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { isActive: true },
        })
        if (dbUser && !dbUser.isActive) return false
      }
      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as { role?: string; mfaRequired?: boolean }
        token.role = u.role ?? 'user'
        token.id = user.id
        token.mfaRequired = u.mfaRequired ?? false
      }
      if (trigger === 'update') {
        if (session?.role) token.role = session.role
        if (session?.mfaRequired === false) token.mfaRequired = false
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.role = (token.role as string) ?? 'user'
        session.user.id = token.id as string
        session.user.mfaRequired = (token.mfaRequired as boolean) ?? false
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { role: 'user', isActive: true },
      })
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)

// Extend types
declare module 'next-auth' {
  interface User {
    role?: string
    mfaRequired?: boolean
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      mfaRequired?: boolean
    }
  }
}

