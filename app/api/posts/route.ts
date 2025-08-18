import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/services/postService'
import { verifyAuth } from '@/lib/auth'

// GET /api/posts - ユーザーの投稿一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let posts
    if (status) {
      posts = await PostService.getPostsByStatus(String(user.id), status)
    } else {
      posts = await PostService.getUserPosts(String(user.id))
    }

    return NextResponse.json({ posts })

  } catch (error: any) {
    console.error('投稿取得エラー:', error)
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'トークンが期限切れです' }, { status: 401 })
    } else if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }
    
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
  }
}

// POST /api/posts - 新規投稿作成
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const body = await request.json().catch(() => ({}))
    const { caption, image_url, status, scheduled_at } = body
    
    if (!caption) {
      return NextResponse.json({ error: 'キャプションは必須です' }, { status: 400 })
    }

    const validStatuses = ['draft', 'scheduled', 'published']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
    }

    // スケジュール投稿の場合、未来の時間かチェック
    if (status === 'scheduled' && scheduled_at) {
      const scheduledTime = new Date(scheduled_at)
      if (scheduledTime <= new Date()) {
        return NextResponse.json({ error: 'スケジュール時間は未来の時間を指定してください' }, { status: 400 })
      }
    }

    const postData = {
      user_id: String(user.id),
      caption,
      image_url: image_url || null,
      status: status || 'draft',
      scheduled_at: status === 'scheduled' ? scheduled_at : null
    }

    const post = await PostService.createPost(postData)
    return NextResponse.json({ post }, { status: 201 })

  } catch (error: any) {
    console.error('投稿作成エラー:', error)
    return NextResponse.json({ error: error.message || '投稿の作成に失敗しました' }, { status: 500 })
  }
}