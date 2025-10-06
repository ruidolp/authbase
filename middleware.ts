import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  
  console.log('🔍 Middleware:', {
    path: req.nextUrl.pathname,
    isLoggedIn,
    hasAuth: !!req.auth,
    userId: req.auth?.user?.id
  })
  
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  const isDashboardRoute = 
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/videos') ||
    req.nextUrl.pathname.startsWith('/stats') ||
    req.nextUrl.pathname.startsWith('/editor') ||
    req.nextUrl.pathname.startsWith('/family')

  if (isDashboardRoute && !isLoggedIn) {
    console.log('❌ Redirigiendo a /login desde middleware')
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuthPage && isLoggedIn) {
    console.log('✅ Ya logueado, redirigiendo a /dashboard')
    return Response.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|watch).*)'],
}