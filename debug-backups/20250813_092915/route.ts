import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: Request) {
  try {
    // Authorizationヘッダーからトークンを取得
    const auth = request.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    
    if (!token) {
      return NextResponse.json({ error: '認証トークンが必要です' }, { status: 401 })
    }

    // JWT検証
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'development-secret'
    const decoded = jwt.verify(token, jwtSecret) as { userId: string, email: string, role: string }
    
    // データベースからユーザー情報を取得
    // Dynamic import to prevent client-side bundling
    const { default: database } = await import('@/lib/database')
    const userResult = await database.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // ユーザー情報を返却（パスワード等は除外）
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at
    })

  } catch (error: unknown) {
    console.error('Auth verification error:', error)
    
    // JWT関連のエラーハンドリング
    const err = error as { name?: string }
    if (err.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'トークンが期限切れです' }, { status: 401 })
    } else if (err.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }
    
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })
  }
}


