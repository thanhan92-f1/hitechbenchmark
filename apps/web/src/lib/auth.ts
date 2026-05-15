import NextAuth from 'next-auth'
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
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
          },
        })

        if (!user || !user.isActive) return null
        if (!user.password) return null // OAuth-only account

        let passwordMatch = false
        if (user.password.startsWith('$2')) {
          passwordMatch = await compare(parsed.data.password, user.password)
        } else {
          const sha256 = createHash('sha256').update(parsed.data.password).digest('hex')
          passwordMatch = sha256 === user.password
        }

        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth sign-ins, ensure user is active
      if (account?.provider !== 'credentials') {
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { isActive: true },
        })
        if (dbUser && !dbUser.isActive) return false

        // Set default role if new OAuth user
        if (!dbUser) {
          // Will be created by adapter — update role after
          return true
        }
      }
      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'user'
        token.id = user.id
      }
      if (trigger === 'update' && session?.role) {
        token.role = session.role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.role = (token.role as string) ?? 'user'
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Ensure new OAuth users get the default 'user' role and are active
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
})

// Extend types
declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    id?: string
  }
}
