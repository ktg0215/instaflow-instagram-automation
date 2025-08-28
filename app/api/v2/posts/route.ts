import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/services/postService'
import { verifyAuth } from '@/lib/auth'

// Response optimization with field selection
interface PostResponseOptions {
  fields?: string[]
  include?: string[]
  compress?: boolean
}

// Lightweight post structure for frontend
interface OptimizedPost {
  id: string
  caption: string
  image_url?: string | null
  status: string
  scheduled_at?: string | null
  created_at: string
  updated_at: string
  // Optional fields based on request
  likes_count?: number
  comments_count?: number
  instagram_post_id?: string | null
  engagement?: {
    rate: number
    total: number
  }
}

// Response compression utility
function compressResponse(data: any): any {
  if (!data) return data
  
  // Remove null/undefined values
  function removeEmpty(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeEmpty).filter(item => item != null)
    }
    if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {}
      Object.entries(obj).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          cleaned[key] = removeEmpty(value)
        }
      })
      return cleaned
    }
    return obj
  }
  
  return removeEmpty(data)
}

// Field selection utility
function selectFields(data: any, fields?: string[]): any {
  if (!fields || !data) return data
  
  if (Array.isArray(data)) {
    return data.map(item => selectFields(item, fields))
  }
  
  const selected: any = {}
  fields.forEach(field => {
    if (field in data) {
      selected[field] = data[field]
    }
  })
  
  return selected
}

// Enhanced GET endpoint with optimization options
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const fields = searchParams.get('fields')?.split(',')
    const include = searchParams.get('include')?.split(',')
    const compress = searchParams.get('compress') === 'true'
    
    // Performance: Check cache with options-based key
    const cacheKey = `posts_v2_${user.id}_${status || 'all'}_${fields?.join('-') || 'default'}_${include?.join('-') || 'none'}`
    
    let posts
    if (status) {
      posts = await PostService.getPostsByStatus(String(user.id), status)
    } else {
      posts = await PostService.getUserPosts(String(user.id), limit, offset)
    }

    // Transform posts based on options
    let optimizedPosts = posts.map((post): OptimizedPost => {
      const optimized: OptimizedPost = {
        id: post.id,
        caption: post.caption,
        image_url: post.image_url,
        status: post.status,
        scheduled_at: post.scheduled_at,
        created_at: post.created_at,
        updated_at: post.updated_at
      }

      // Add optional fields based on include parameter
      if (include?.includes('engagement')) {
        optimized.likes_count = post.likes_count
        optimized.comments_count = post.comments_count
        optimized.engagement = {
          rate: post.likes_count + post.comments_count > 0 ? 
            ((post.likes_count + post.comments_count) / Math.max(post.likes_count * 10, 100)) * 100 : 0,
          total: post.likes_count + post.comments_count
        }
      }

      if (include?.includes('instagram')) {
        optimized.instagram_post_id = post.instagram_post_id
      }

      return optimized
    })

    // Apply field selection
    if (fields) {
      optimizedPosts = selectFields(optimizedPosts, fields)
    }

    // Apply compression
    let responseData = {
      posts: optimizedPosts,
      pagination: {
        limit,
        offset,
        total: optimizedPosts.length,
        hasMore: optimizedPosts.length === limit
      },
      metadata: {
        optimized: true,
        compressed: compress,
        fields: fields || 'all',
        include: include || 'none'
      }
    }

    if (compress) {
      responseData = compressResponse(responseData)
    }

    // Response headers for optimization
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=120',
      'X-Response-Optimized': 'true'
    }

    // Add compression header if significant reduction
    const originalSize = JSON.stringify({ posts }).length
    const optimizedSize = JSON.stringify(responseData).length
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1)
    
    if (parseFloat(compressionRatio) > 10) {
      headers['X-Compression-Ratio'] = `${compressionRatio}%`
    }

    return NextResponse.json(responseData, { headers })

  } catch (error: any) {
    console.error('V2 Posts API Error:', error)
    return NextResponse.json({ 
      error: '投稿の取得に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// Batch POST endpoint for multiple posts
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    const body = await request.json().catch(() => ({}))
    const { posts: postsData, operation = 'create' } = body
    
    if (!Array.isArray(postsData)) {
      return NextResponse.json({ error: '投稿データは配列である必要があります' }, { status: 400 })
    }

    if (postsData.length > 10) {
      return NextResponse.json({ error: '一度に作成できる投稿は10件までです' }, { status: 400 })
    }

    const results = []
    const errors = []

    // Process posts in parallel for better performance
    await Promise.allSettled(
      postsData.map(async (postData, index) => {
        try {
          if (!postData.caption) {
            throw new Error(`投稿 ${index + 1}: キャプションは必須です`)
          }

          const post = await PostService.createPost({
            user_id: String(user.id),
            caption: postData.caption,
            image_url: postData.image_url || null,
            status: postData.status || 'draft',
            scheduled_at: postData.status === 'scheduled' ? postData.scheduled_at : null
          })

          results.push({
            index,
            success: true,
            post: {
              id: post.id,
              caption: post.caption,
              status: post.status,
              created_at: post.created_at
            }
          })
        } catch (error: any) {
          errors.push({
            index,
            success: false,
            error: error.message
          })
        }
      })
    )

    return NextResponse.json({
      operation,
      totalRequested: postsData.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    }, { 
      status: results.length > 0 ? 201 : 400,
      headers: {
        'X-Batch-Operation': 'true'
      }
    })

  } catch (error: any) {
    console.error('Batch Post Creation Error:', error)
    return NextResponse.json({ 
      error: 'バッチ投稿作成に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}