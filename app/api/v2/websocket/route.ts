import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { WebSocketEmitter } from '@/lib/websocket'

// WebSocket connection info endpoint
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    return NextResponse.json({
      websocket: {
        enabled: true,
        endpoint: process.env.NODE_ENV === 'production' 
          ? 'wss://your-domain.com' 
          : 'ws://localhost:3000',
        auth: {
          required: true,
          method: 'token'
        },
        events: [
          'post:created',
          'post:updated', 
          'post:published',
          'post:scheduled',
          'post:failed',
          'analytics:updated',
          'usage:updated',
          'system:notification'
        ],
        rooms: [
          `user:${user.id}`,
          'dashboard',
          'analytics'
        ]
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'WebSocket情報の取得に失敗しました' 
    }, { status: 500 })
  }
}

// Manual event trigger for testing
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: '本機能は開発環境でのみ利用可能です' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { event, data, target = 'user' } = body

    if (!event || !data) {
      return NextResponse.json({ error: 'イベントとデータは必須です' }, { status: 400 })
    }

    const validEvents = [
      'post:created', 'post:updated', 'post:published', 'post:scheduled', 'post:failed',
      'analytics:updated', 'usage:updated', 'system:notification'
    ]

    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: '無効なイベントタイプです' }, { status: 400 })
    }

    // Emit the event
    if (target === 'user') {
      WebSocketEmitter.emitToUser(String(user.id), event, data)
    } else if (target === 'room') {
      WebSocketEmitter.emitToRoom(data.room || 'global', event, data)
    } else if (target === 'broadcast') {
      WebSocketEmitter.broadcast(event, data)
    }

    return NextResponse.json({
      success: true,
      event,
      target,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('WebSocket Event Trigger Error:', error)
    return NextResponse.json({ 
      error: 'イベント送信に失敗しました',
      details: error.message
    }, { status: 500 })
  }
}