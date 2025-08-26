import { NextResponse } from 'next/server'
import { PostService } from '@/services/postService'
import { auth } from '@/lib/auth'

// GET /api/posts/[id] - 特定の投稿取得
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = session.user.id
    
    const params = await context.params;
    const post = await PostService.getPostById(params.id)
    
    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    // 投稿の所有者かチェック
    if (post.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    return NextResponse.json({ post })

  } catch (error: any) {
    console.error('投稿取得エラー:', error)
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 })
  }
}

// PUT /api/posts/[id] - 投稿更新
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = session.user.id
    
    const params = await context.params;
    // 投稿の存在確認と所有者チェック
    const existingPost = await PostService.getPostById(params.id)
    if (!existingPost) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    if (existingPost.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }
    
    const body = await request.json().catch(() => ({}))
    const { caption, image_url, status, scheduled_at } = body
    
    const updates: any = {}
    
    if (caption !== undefined) updates.caption = caption
    if (image_url !== undefined) updates.image_url = image_url
    if (status !== undefined) {
      const validStatuses = ['draft', 'scheduled', 'published', 'failed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
      }
      updates.status = status
    }
    
    if (scheduled_at !== undefined) {
      if (status === 'scheduled' && scheduled_at) {
        const scheduledTime = new Date(scheduled_at)
        if (scheduledTime <= new Date()) {
          return NextResponse.json({ error: 'スケジュール時間は未来の時間を指定してください' }, { status: 400 })
        }
      }
      updates.scheduled_at = scheduled_at
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '更新データがありません' }, { status: 400 })
    }

    const post = await PostService.updatePost(params.id, updates)
    return NextResponse.json({ post })

  } catch (error: any) {
    console.error('投稿更新エラー:', error)
    return NextResponse.json({ error: error.message || '投稿の更新に失敗しました' }, { status: 500 })
  }
}

// DELETE /api/posts/[id] - 投稿削除
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = session.user.id
    
    const params = await context.params;
    // 投稿の存在確認と所有者チェック
    const existingPost = await PostService.getPostById(params.id)
    if (!existingPost) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    if (existingPost.user_id !== userId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }
    
    await PostService.deletePost(params.id)
    return NextResponse.json({ message: '投稿が削除されました' })

  } catch (error: any) {
    console.error('投稿削除エラー:', error)
    return NextResponse.json({ error: error.message || '投稿の削除に失敗しました' }, { status: 500 })
  }
}