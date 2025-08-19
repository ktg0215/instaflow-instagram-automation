import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const GET = auth(async function GET(request) {
  try {
    // NextAuth v5 session check
    if (!request.auth || !request.auth.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = request.auth.user

    // NextAuth provides user info directly from session
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image
    })

  } catch (error: unknown) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })
  }
}) as any


