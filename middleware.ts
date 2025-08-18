import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  console.log('🚀 NextAuth v5 Middleware: Processing', pathname)
  console.log('🔍 Session:', req.auth ? 'Found' : 'Not found')

  const isOnLoginPage = pathname === '/login' || pathname === '/signup'
  const isOnLandingPage = pathname === '/'
  const isProtectedRoute = [
    '/dashboard', '/create', '/schedule', '/analytics', '/settings', '/ai'
  ].some(route => pathname.startsWith(route))

  const isLoggedIn = !!req.auth

  if (isLoggedIn) {
    console.log('🔐 User authenticated:', req.auth?.user?.email)
  } else {
    console.log('🔓 No authentication found')
  }

  // Allow authenticated users to access login/signup pages (they will be handled by the pages themselves)
  if (isLoggedIn && isOnLoginPage) {
    console.log('🔐 Authenticated user accessing login page - allowing access')
    return NextResponse.next()
  }

  // Allow everyone to access landing page
  if (isOnLandingPage) {
    console.log('🏠 Landing page access allowed')
    return NextResponse.next()
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    console.log('❌ Redirecting unauthenticated user to login')
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('✅ Request authorized')
  return NextResponse.next()
}, {
  callbacks: {
    authorized: ({ auth }) => !!auth
  }
})