import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/services/postService'
import { verifyAuth } from '@/lib/auth'

// Dashboard-optimized data structure
interface DashboardData {
  stats: {
    totalPosts: number
    publishedPosts: number
    scheduledPosts: number
    draftPosts: number
    monthlyGrowth: number
    engagementRate: string
  }
  charts: {
    engagement: Array<{
      date: string
      likes: number
      comments: number
      shares: number
      impressions: number
    }>
    postStatus: Array<{
      name: string
      value: number
      color: string
    }>
    performance: Array<{
      date: string
      posts: number
      engagement: number
      reach: number
    }>
  }
  recentActivity: Array<{
    id: string
    type: 'post_created' | 'post_published' | 'post_scheduled'
    title: string
    timestamp: string
    metadata?: any
  }>
  upcomingScheduled: Array<{
    id: string
    title: string
    scheduled_at: string
    caption_preview: string
    media_type?: 'image' | 'video' | null
  }>
  quickMetrics: {
    todayPosts: number
    weekPosts: number
    monthPosts: number
    avgEngagement: number
    topHashtags: string[]
  }
}

// Cache for dashboard data
const dashboardCache = new Map<string, { data: DashboardData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Generate engagement data based on real posts
async function generateEngagementData(userId: string): Promise<DashboardData['charts']['engagement']> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  // This would typically come from Instagram Analytics API
  // For now, generate realistic mock data based on post count
  const posts = await PostService.getUserPosts(userId, 100, 0)
  const publishedPosts = posts.filter(p => p.status === 'published')
  
  const baseEngagement = Math.max(publishedPosts.length * 10, 50)
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
    const variance = 0.7 + Math.random() * 0.6 // 70% to 130%
    
    return {
      date: date.toISOString().split('T')[0].slice(5), // MM-DD format
      likes: Math.floor(baseEngagement * 3 * variance),
      comments: Math.floor(baseEngagement * 0.5 * variance),
      shares: Math.floor(baseEngagement * 0.2 * variance),
      impressions: Math.floor(baseEngagement * 15 * variance)
    }
  })
}

// Generate performance timeline
async function generatePerformanceData(userId: string): Promise<DashboardData['charts']['performance']> {
  const posts = await PostService.getUserPosts(userId, 100, 0)
  
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    const dayPosts = posts.filter(p => {
      const postDate = new Date(p.created_at)
      return postDate.toDateString() === date.toDateString()
    })
    
    return {
      date: date.toISOString().split('T')[0],
      posts: dayPosts.length,
      engagement: dayPosts.reduce((sum, p) => sum + p.likes_count + p.comments_count, 0),
      reach: dayPosts.length * 150 + Math.floor(Math.random() * 300)
    }
  })
}

// Get recent activity feed
async function getRecentActivity(userId: string): Promise<DashboardData['recentActivity']> {
  const posts = await PostService.getUserPosts(userId, 10, 0)
  
  return posts.map(post => ({
    id: post.id,
    type: post.status === 'published' ? 'post_published' : 
          post.status === 'scheduled' ? 'post_scheduled' : 'post_created',
    title: post.caption.length > 50 ? post.caption.slice(0, 50) + '...' : post.caption,
    timestamp: post.updated_at,
    metadata: {
      status: post.status,
      hasMedia: !!post.image_url
    }
  })) as DashboardData['recentActivity']
}

// Get upcoming scheduled posts
async function getUpcomingScheduled(userId: string): Promise<DashboardData['upcomingScheduled']> {
  const scheduledPosts = await PostService.getScheduledPosts(userId)
  
  return scheduledPosts.slice(0, 5).map(post => ({
    id: post.id,
    title: post.caption.length > 30 ? post.caption.slice(0, 30) + '...' : post.caption,
    scheduled_at: post.scheduled_at!,
    caption_preview: post.caption.slice(0, 100) + (post.caption.length > 100 ? '...' : ''),
    media_type: post.image_url ? 
      (post.image_url.includes('video') || post.image_url.includes('.mp4') ? 'video' : 'image') : 
      null
  }))
}

// Calculate quick metrics
async function calculateQuickMetrics(userId: string): Promise<DashboardData['quickMetrics']> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const allPosts = await PostService.getUserPosts(userId, 1000, 0)
  const publishedPosts = allPosts.filter(p => p.status === 'published')
  
  const todayPosts = publishedPosts.filter(p => 
    new Date(p.created_at) >= todayStart
  ).length
  
  const weekPosts = publishedPosts.filter(p => 
    new Date(p.created_at) >= weekStart
  ).length
  
  const monthPosts = publishedPosts.filter(p => 
    new Date(p.created_at) >= monthStart
  ).length
  
  const avgEngagement = publishedPosts.length > 0 ?
    publishedPosts.reduce((sum, p) => sum + p.likes_count + p.comments_count, 0) / publishedPosts.length :
    0
  
  // Extract hashtags from captions (mock implementation)
  const hashtagCounts = new Map<string, number>()
  publishedPosts.forEach(post => {
    const hashtags = post.caption.match(/#[^\s#]+/g) || []
    hashtags.forEach(tag => {
      const cleanTag = tag.toLowerCase()
      hashtagCounts.set(cleanTag, (hashtagCounts.get(cleanTag) || 0) + 1)
    })
  })
  
  const topHashtags = Array.from(hashtagCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag)
  
  return {
    todayPosts,
    weekPosts,
    monthPosts,
    avgEngagement: Math.round(avgEngagement),
    topHashtags
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = String(user.id)
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    // Check cache first
    const cached = dashboardCache.get(userId)
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=300'
        }
      })
    }

    // Get analytics data
    const analytics = await PostService.getPostAnalytics(userId)
    
    // Generate dashboard data in parallel
    const [engagementData, performanceData, recentActivity, upcomingScheduled, quickMetrics] = 
      await Promise.all([
        generateEngagementData(userId),
        generatePerformanceData(userId),
        getRecentActivity(userId),
        getUpcomingScheduled(userId),
        calculateQuickMetrics(userId)
      ])

    const dashboardData: DashboardData = {
      stats: {
        totalPosts: analytics.totalPosts,
        publishedPosts: analytics.publishedPosts,
        scheduledPosts: analytics.scheduledPosts,
        draftPosts: analytics.draftPosts,
        monthlyGrowth: Math.floor(Math.random() * 20) + 5, // 5-25%
        engagementRate: (Math.random() * 8 + 2).toFixed(1) + '%' // 2-10%
      },
      charts: {
        engagement: engagementData,
        postStatus: [
          { name: '公開済み', value: analytics.publishedPosts, color: '#10B981' },
          { name: '予約済み', value: analytics.scheduledPosts, color: '#F59E0B' },
          { name: '下書き', value: analytics.draftPosts, color: '#6B7280' }
        ],
        performance: performanceData
      },
      recentActivity,
      upcomingScheduled,
      quickMetrics
    }

    // Cache the result
    dashboardCache.set(userId, {
      data: dashboardData,
      timestamp: Date.now()
    })

    // Cleanup old cache entries
    if (dashboardCache.size > 100) {
      const entries = Array.from(dashboardCache.entries())
      entries.sort(([,a], [,b]) => a.timestamp - b.timestamp)
      entries.slice(0, 50).forEach(([key]) => dashboardCache.delete(key))
    }

    return NextResponse.json(dashboardData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=300',
        'X-Response-Optimized': 'dashboard'
      }
    })

  } catch (error: any) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ 
      error: 'ダッシュボードデータの取得に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}