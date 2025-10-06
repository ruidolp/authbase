import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = request.cookies.get('authjs.session-token')?.value || 
                request.cookies.get('__Secure-authjs.session-token')?.value

  const isLoggedIn = !!token
  const isAuthPage = path.startsWith('/login')
  const isDashboardRoute = 
    path.startsWith('/dashboard') ||
    path.startsWith('/editor') ||
    path.startsWith('/family')

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|watch).*)'],
}
