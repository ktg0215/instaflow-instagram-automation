import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  
  // SECURITY: Apply rate limiting to all requests
  const rateLimitResult = await applyRateLimit(req, pathname, req.auth?.user?.id);
  
  if (!rateLimitResult.success) {
    const response = NextResponse.json(
      { error: rateLimitResult.error },
      { status: 429 }
    );
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  console.log('🚀 NextAuth v5 Middleware: Processing', pathname)
  console.log('🔍 Session:', req.auth ? 'Found' : 'Not found')
  console.log('🔒 Client IP:', getClientIP(req))

  const isOnLoginPage = pathname === '/login' || pathname === '/signup'
  const isOnLandingPage = pathname === '/'
  const isProtectedRoute = [
    '/dashboard', '/create', '/schedule', '/analytics', '/settings', '/ai'
  ].some(route => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api')

  const isLoggedIn = !!req.auth

  if (isLoggedIn) {
    console.log('🔐 User authenticated:', req.auth?.user?.email)
  } else {
    console.log('🔓 No authentication found')
  }

  // SECURITY: Create response with security headers
  let response: NextResponse;

  // Handle API routes separately
  if (isApiRoute) {
    // API routes handle their own authentication
    response = NextResponse.next()
  }
  // Allow authenticated users to access login/signup pages
  else if (isLoggedIn && isOnLoginPage) {
    console.log('🔐 Authenticated user accessing login page - allowing access')
    response = NextResponse.next()
  }
  // Allow everyone to access landing page
  else if (isOnLandingPage) {
    console.log('🏠 Landing page access allowed')
    response = NextResponse.next()
  }
  // Redirect unauthenticated users away from protected routes
  else if (isProtectedRoute && !isLoggedIn) {
    console.log('❌ Redirecting unauthenticated user to login')
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    response = NextResponse.redirect(loginUrl)
  }
  else {
    console.log('✅ Request authorized')
    response = NextResponse.next()
  }

  // SECURITY: Add comprehensive security headers
  const securityHeaders = {
    // SECURITY: Content Security Policy - prevents XSS attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.openai.com https://graph.facebook.com https://graph.instagram.com https://*.supabase.co https://generativelanguage.googleapis.com",
      "frame-src 'self' https://accounts.google.com",
      "media-src 'self' https: blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    // SECURITY: HTTP Strict Transport Security - enforces HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // SECURITY: X-Content-Type-Options - prevents MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // SECURITY: X-Frame-Options - prevents clickjacking
    'X-Frame-Options': 'DENY',
    
    // SECURITY: X-XSS-Protection - enables XSS filtering
    'X-XSS-Protection': '1; mode=block',
    
    // SECURITY: Referrer Policy - controls referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // SECURITY: Permissions Policy - controls browser features
    'Permissions-Policy': [
      'camera=self',
      'microphone=self',
      'geolocation=self',
      'interest-cohort=()'
    ].join(', '),
    
    // SECURITY: Cross-Origin Embedder Policy
    'Cross-Origin-Embedder-Policy': 'require-corp',
    
    // SECURITY: Cross-Origin Opener Policy
    'Cross-Origin-Opener-Policy': 'same-origin',
    
    // SECURITY: Cross-Origin Resource Policy
    'Cross-Origin-Resource-Policy': 'same-origin'
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add rate limit headers if they exist
  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // SECURITY: Remove server information
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}