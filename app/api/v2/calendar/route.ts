import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/services/postService'
import { verifyAuth } from '@/lib/auth'
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'published' | 'scheduled' | 'draft'
  status: 'completed' | 'pending' | 'draft'
  caption_preview: string
  media_type?: 'image' | 'video' | null
  engagement?: {
    likes: number
    comments: number
  }
  color: string
}

interface CalendarData {
  month: string
  year: number
  events: CalendarEvent[]
  summary: {
    totalEvents: number
    publishedCount: number
    scheduledCount: number
    draftCount: number
    avgPostsPerDay: number
    bestPerformingDay?: string
  }
  monthlyGoals: {
    targetPosts: number
    currentPosts: number
    progress: number
    remainingDays: number
  }
}

// Cache for calendar data
const calendarCache = new Map<string, { data: CalendarData; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = String(user.id)
    const { searchParams } = new URL(request.url)
    
    // Parse date parameters
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    const currentDate = new Date()
    const year = yearParam ? parseInt(yearParam) : currentDate.getFullYear()
    const month = monthParam ? parseInt(monthParam) - 1 : currentDate.getMonth() // 0-indexed
    
    const requestedDate = new Date(year, month, 1)
    const monthStart = startOfMonth(requestedDate)
    const monthEnd = endOfMonth(requestedDate)
    
    const cacheKey = `calendar_${userId}_${year}_${month}`
    
    // Check cache first
    const cached = calendarCache.get(cacheKey)
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=600'
        }
      })
    }

    // Get posts for the month with extended range for better context
    const extendedStart = new Date(monthStart.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 week before
    const extendedEnd = new Date(monthEnd.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week after
    
    const allPosts = await PostService.getUserPosts(userId, 1000, 0)
    
    // Filter posts for the extended date range
    const relevantPosts = allPosts.filter(post => {
      const postDate = new Date(post.scheduled_at || post.created_at)
      return postDate >= extendedStart && postDate <= extendedEnd
    })

    // Transform posts to calendar events
    const events: CalendarEvent[] = relevantPosts.map(post => {
      const eventDate = new Date(post.scheduled_at || post.created_at)
      const isScheduled = post.status === 'scheduled' && post.scheduled_at
      
      return {
        id: post.id,
        title: post.caption.length > 30 ? post.caption.slice(0, 30) + '...' : post.caption,
        date: format(eventDate, 'yyyy-MM-dd'),
        time: isScheduled ? format(eventDate, 'HH:mm') : undefined,
        type: post.status as 'published' | 'scheduled' | 'draft',
        status: post.status === 'published' ? 'completed' : 
                post.status === 'scheduled' ? 'pending' : 'draft',
        caption_preview: post.caption.slice(0, 100) + (post.caption.length > 100 ? '...' : ''),
        media_type: post.image_url ? 
          (post.image_url.includes('video') || post.image_url.includes('.mp4') ? 'video' : 'image') : 
          null,
        engagement: post.status === 'published' ? {
          likes: post.likes_count,
          comments: post.comments_count
        } : undefined,
        color: post.status === 'published' ? '#10B981' : // Green
               post.status === 'scheduled' ? '#F59E0B' : // Orange
               '#6B7280' // Gray
      }
    })

    // Filter events specifically for the requested month for summary
    const monthEvents = events.filter(event => {
      const eventDate = parseISO(event.date)
      return eventDate >= monthStart && eventDate <= monthEnd
    })

    // Calculate summary statistics
    const publishedCount = monthEvents.filter(e => e.type === 'published').length
    const scheduledCount = monthEvents.filter(e => e.type === 'scheduled').length
    const draftCount = monthEvents.filter(e => e.type === 'draft').length
    const totalEvents = monthEvents.length

    // Calculate average posts per day for the month
    const daysInMonth = monthEnd.getDate()
    const avgPostsPerDay = parseFloat((totalEvents / daysInMonth).toFixed(2))

    // Find best performing day (highest engagement)
    let bestPerformingDay: string | undefined
    if (publishedCount > 0) {
      const dayEngagement = new Map<string, number>()
      
      monthEvents.filter(e => e.engagement).forEach(event => {
        const day = format(parseISO(event.date), 'yyyy-MM-dd')
        const engagement = (event.engagement!.likes + event.engagement!.comments)
        dayEngagement.set(day, (dayEngagement.get(day) || 0) + engagement)
      })

      if (dayEngagement.size > 0) {
        bestPerformingDay = Array.from(dayEngagement.entries())
          .sort(([,a], [,b]) => b - a)[0][0]
      }
    }

    // Calculate monthly goals (example: 20 posts per month)
    const targetPosts = 20
    const currentPosts = publishedCount + scheduledCount
    const progress = Math.min((currentPosts / targetPosts) * 100, 100)
    const remainingDays = Math.max(0, monthEnd.getDate() - new Date().getDate())

    const calendarData: CalendarData = {
      month: format(requestedDate, 'MMMM'),
      year,
      events: events, // Return all events for context
      summary: {
        totalEvents,
        publishedCount,
        scheduledCount,
        draftCount,
        avgPostsPerDay,
        bestPerformingDay
      },
      monthlyGoals: {
        targetPosts,
        currentPosts,
        progress: parseFloat(progress.toFixed(1)),
        remainingDays
      }
    }

    // Cache the result
    calendarCache.set(cacheKey, {
      data: calendarData,
      timestamp: Date.now()
    })

    // Cleanup old cache entries
    if (calendarCache.size > 50) {
      const entries = Array.from(calendarCache.entries())
      entries.sort(([,a], [,b]) => a.timestamp - b.timestamp)
      entries.slice(0, 25).forEach(([key]) => calendarCache.delete(key))
    }

    return NextResponse.json(calendarData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=600',
        'X-Response-Optimized': 'calendar'
      }
    })

  } catch (error: any) {
    console.error('Calendar API Error:', error)
    return NextResponse.json({ 
      error: 'カレンダーデータの取得に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST endpoint for creating/updating calendar events
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { date, time, caption, action = 'schedule' } = body
    
    if (!date || !caption) {
      return NextResponse.json({ error: '日付とキャプションは必須です' }, { status: 400 })
    }

    // Combine date and time
    const scheduledDateTime = time ? 
      new Date(`${date}T${time}:00`) : 
      new Date(`${date}T12:00:00`)

    if (scheduledDateTime <= new Date()) {
      return NextResponse.json({ error: 'スケジュール時間は未来の時間を指定してください' }, { status: 400 })
    }

    // Create the scheduled post
    const post = await PostService.createPost({
      user_id: String(user.id),
      caption,
      status: 'scheduled',
      scheduled_at: scheduledDateTime.toISOString()
    })

    // Invalidate relevant calendar caches
    const year = scheduledDateTime.getFullYear()
    const month = scheduledDateTime.getMonth()
    const cacheKey = `calendar_${user.id}_${year}_${month}`
    calendarCache.delete(cacheKey)

    return NextResponse.json({
      success: true,
      event: {
        id: post.id,
        title: post.caption.slice(0, 30) + (post.caption.length > 30 ? '...' : ''),
        date: format(scheduledDateTime, 'yyyy-MM-dd'),
        time: format(scheduledDateTime, 'HH:mm'),
        type: 'scheduled',
        status: 'pending'
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Calendar Event Creation Error:', error)
    return NextResponse.json({ 
      error: 'カレンダーイベントの作成に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}