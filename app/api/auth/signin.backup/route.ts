import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    console.log('🔍 [SIGNIN] Starting authentication process')
    
    // Parse JSON with error handling
    let email, password
    try {
      const body = await request.json()
      console.log('🔍 [SIGNIN] Raw request body:', JSON.stringify(body))
      email = body.email
      password = body.password
    } catch (jsonError) {
      console.error('❌ [SIGNIN] JSON parsing error:', jsonError)
      return NextResponse.json({ error: 'リクエストの形式が正しくありません' }, { status: 400 })
    }
    
    console.log(`🔍 [SIGNIN] Received credentials - email: ${email}, password length: ${password?.length}`)
    
    // バリデーション
    if (!email || !password) {
      console.log('❌ [SIGNIN] Validation failed - missing email or password')
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 })
    }

    // データベースからユーザーを検索
    // Dynamic import to prevent client-side bundling
    console.log('🔍 [SIGNIN] Querying database for user')
    const { default: database } = await import('@/lib/database')
    const userResult = await database.query(
      'SELECT id, email, password, name, role, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    console.log(`🔍 [SIGNIN] Database query result - found ${userResult.rows.length} users`)

    if (userResult.rows.length === 0) {
      console.log('❌ [SIGNIN] User not found in database')
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが間違っています' }, { status: 401 })
    }

    const user = userResult.rows[0]
    console.log(`🔍 [SIGNIN] Found user - id: ${user.id}, email: ${user.email}`)
    console.log(`🔍 [SIGNIN] Stored password hash: ${user.password}`)

    // パスワード照合
    console.log('🔍 [SIGNIN] Starting password comparison')
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log(`🔍 [SIGNIN] Password comparison result: ${isValidPassword}`)
    
    if (!isValidPassword) {
      console.log('❌ [SIGNIN] Password comparison failed')
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが間違っています' }, { status: 401 })
    }

    console.log('✅ [SIGNIN] Password verification successful - preparing response')

    // JWT生成
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'development-secret'
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // 成功レスポンス（パスワードハッシュは除外）
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      },
      token
    })

    // サーバーサイドでCookieを設定（7日間）
    response.cookies.set('auth_token', token, {
      httpOnly: false,  // クライアントサイドアクセス可能
      secure: false,    // 開発環境では false
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7日間（秒単位）
      path: '/'
    })
    
    console.log('Cookie set successfully for user:', user.email)

    return response

  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: error?.message || 'サインインに失敗しました' }, { status: 500 })
  }
}


