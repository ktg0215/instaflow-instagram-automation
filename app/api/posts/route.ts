import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/services/postService'
import { verifyAuth } from '@/lib/auth'

// Performance: Response caching
const responseCache = new Map<string, { data: any; timestamp: number; etag: string }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

function generateETag(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 16)
}

function getCacheKey(userId: string, status?: string): string {
  return `posts_${userId}_${status || 'all'}`
}

// GET /api/posts - ユーザーの投稿一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Performance: Check cache first
    const cacheKey = getCacheKey(String(user.id), status || undefined)
    const cached = responseCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Check If-None-Match header for 304 Not Modified
      const ifNoneMatch = request.headers.get('if-none-match')
      if (ifNoneMatch === cached.etag) {
        return new NextResponse(null, { status: 304 })
      }
      
      return NextResponse.json(cached.data, {
        headers: {
          'ETag': cached.etag,
          'Cache-Control': 'private, max-age=120', // 2 minutes
        }
      })
    }
    
    let posts
    if (status) {
      posts = await PostService.getPostsByStatus(String(user.id), status)
    } else {
      posts = await PostService.getUserPosts(String(user.id), limit, offset)
    }

    const responseData = { posts }
    const etag = generateETag(responseData)
    
    // Performance: Cache the response
    responseCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
      etag
    })
    
    // Cleanup old cache entries
    if (responseCache.size > 100) {
      const entries = Array.from(responseCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      entries.slice(0, 50).forEach(([key]) => responseCache.delete(key))
    }

    return NextResponse.json(responseData, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'private, max-age=120', // 2 minutes
      }
    })

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
    
    // Performance: Invalidate relevant caches after creation
    const userCacheKeys = Array.from(responseCache.keys()).filter(key => key.startsWith(`posts_${user.id}`))
    userCacheKeys.forEach(key => responseCache.delete(key))
    
    return NextResponse.json({ post }, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error: any) {
    console.error('投稿作成エラー:', error)
    return NextResponse.json({ error: error.message || '投稿の作成に失敗しました' }, { status: 500 })
  }
}