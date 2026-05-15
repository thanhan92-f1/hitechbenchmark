import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'support']

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!req.auth?.user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (!ADMIN_ROLES.includes(req.auth.user.role)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!req.auth?.user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/api/admin/:path*'],
}
