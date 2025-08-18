import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json().catch(() => ({}))
    
    // バリデーション
    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'パスワードは6文字以上で設定してください' }, { status: 400 })
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 })
    }

    // Dynamic import to prevent client-side bundling
    const { default: database } = await import('@/lib/database')
    
    // 重複チェック
    const existingUserResult = await database.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 })
    }

    // パスワードハッシュ化
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // ユーザー名を生成（メールアドレスの@より前の部分）
    const name = email.split('@')[0]

    // ユーザーをデータベースに挿入
    const insertResult = await database.query(
      `INSERT INTO users (email, password, name, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase(), hashedPassword, name, 'user']
    )

    const user = insertResult.rows[0]

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
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      },
      token
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: error?.message || 'サインアップに失敗しました' }, { status: 500 })
  }
}


