import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  const { pathname } = request.nextUrl

  // Protected routes (Zone 2)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/transactions') || pathname.startsWith('/settings')) {
    if (!token) {
      // COMMENTED OUT FOR DEV: return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Auth routes (redirect to dashboard if logged in)
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      // COMMENTED OUT FOR DEV: return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/transactions/:path*', '/settings/:path*', '/login', '/register'],
}
