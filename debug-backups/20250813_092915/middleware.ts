import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// 保護されたルートのリスト
const protectedRoutes = [
  '/dashboard',
  '/create',
  '/schedule',
  '/analytics',
  '/settings',
  '/ai'
]

// 認証が不要なルート（明示的に許可）
const publicRoutes = [
  '/',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/health',
  '/api/health/db'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静的ファイルやNext.jsの内部ファイルはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // パブリックルートは認証をスキップ
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // 保護されたルートの場合、認証をチェック
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Cookieまたはローカルストレージのトークンをチェック
    // まずはCookieから取得を試行
    let token = request.cookies.get('auth_token')?.value
    
    // Cookieにない場合はAuthorizationヘッダーから取得
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      // トークンがない場合はログインページにリダイレクト
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // JWT検証
      const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'development-secret'
      const decoded = jwt.verify(token, jwtSecret) as { userId: string, email: string, role: string }
      
      // 検証成功 - リクエストを通す
      const response = NextResponse.next()
      
      // デコードしたユーザー情報をヘッダーに追加（必要に応じて）
      response.headers.set('x-user-id', decoded.userId)
      response.headers.set('x-user-email', decoded.email)
      response.headers.set('x-user-role', decoded.role)
      
      return response
      
    } catch (error) {
      // JWT検証失敗 - ログインページにリダイレクト
      console.warn('JWT verification failed:', error)
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('error', 'session_expired')
      
      // 無効なトークンをクリア
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth_token')
      
      return response
    }
  }

  // その他のルートはそのまま通す
  return NextResponse.next()
}

// middleware設定
export const config = {
  matcher: [
    /*
     * 以下のパスを除く全てのパスにマッチ:
     * - api routes that start with `/api/auth` (handled separately)
     * - _next/static (static files)  
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}