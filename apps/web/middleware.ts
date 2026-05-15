import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Protect /dashboard — redirect to login
  if (pathname.startsWith('/dashboard') && !session?.user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url))
  }

  // Protect /admin — require admin-level role
  if (pathname.startsWith('/admin')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url))
    }
    if (!ADMIN_ROLES.includes(session.user.role || '')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
