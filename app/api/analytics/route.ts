import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const GET = auth(async function GET(request) {
  try {
    // NextAuth v5 session check
    if (!request.auth || !request.auth.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = request.auth.user
    const userId = user.id

    console.log('🔍 [ANALYTICS] Getting analytics for user:', userId)

    // Dynamic import to avoid bundling server-only code on client
    const { default: database } = await import('@/lib/database')

    // Get post statistics
    const postStatsQuery = `
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_posts,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts
      FROM posts 
      WHERE user_id = $1
    `

    const postStatsResult = await database.query(postStatsQuery, [userId])
    const postStats = postStatsResult.rows[0] || {
      total_posts: 0,
      published_posts: 0,
      scheduled_posts: 0,
      draft_posts: 0
    }

    // Get recent posts for performance analysis
    const recentPostsQuery = `
      SELECT id, caption, status, created_at, scheduled_at
      FROM posts 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `

    const recentPostsResult = await database.query(recentPostsQuery, [userId])
    const recentPosts = recentPostsResult.rows || []

    // Mock engagement data (in real app, this would come from Instagram API)
    const mockEngagementData = {
      totalEngagement: Math.floor(Math.random() * 10000) + 1000,
      averageReach: Math.floor(Math.random() * 5000) + 500,
      engagementRate: (Math.random() * 10 + 2).toFixed(2), // 2-12%
    }

    const analyticsData = {
      totalPosts: parseInt(postStats.total_posts) || 0,
      publishedPosts: parseInt(postStats.published_posts) || 0,
      scheduledPosts: parseInt(postStats.scheduled_posts) || 0,
      draftPosts: parseInt(postStats.draft_posts) || 0,
      ...mockEngagementData,
      topPerformingPosts: recentPosts.slice(0, 5).map((post: any) => ({
        id: post.id,
        caption: post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : ''),
        engagement: Math.floor(Math.random() * 500) + 50,
        reach: Math.floor(Math.random() * 2000) + 200,
        likes: Math.floor(Math.random() * 300) + 30,
        comments: Math.floor(Math.random() * 50) + 5,
        created_at: post.created_at
      })),
      // Growth metrics (mock data)
      growthMetrics: {
        followers: {
          current: Math.floor(Math.random() * 10000) + 1000,
          change: Math.floor(Math.random() * 200) - 100, // -100 to +100
          changePercent: (Math.random() * 20 - 10).toFixed(1) // -10% to +10%
        },
        engagement: {
          current: mockEngagementData.totalEngagement,
          change: Math.floor(Math.random() * 500) - 250,
          changePercent: (Math.random() * 30 - 15).toFixed(1)
        },
        reach: {
          current: mockEngagementData.averageReach,
          change: Math.floor(Math.random() * 300) - 150,
          changePercent: (Math.random() * 25 - 12.5).toFixed(1)
        }
      },
      // Time series data for charts (mock data)
      timeSeries: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        posts: Math.floor(Math.random() * 5),
        engagement: Math.floor(Math.random() * 500) + 100,
        reach: Math.floor(Math.random() * 1000) + 200
      }))
    }

    console.log('✅ [ANALYTICS] Analytics data generated:', {
      totalPosts: analyticsData.totalPosts,
      publishedPosts: analyticsData.publishedPosts,
      scheduledPosts: analyticsData.scheduledPosts,
      draftPosts: analyticsData.draftPosts
    })

    return NextResponse.json(analyticsData)

  } catch (error: unknown) {
    console.error('❌ [ANALYTICS] Analytics error:', error)
    return NextResponse.json({ error: 'アナリティクスデータの取得に失敗しました' }, { status: 500 })
  }
}) as any