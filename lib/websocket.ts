import 'server-only'
import { Server } from 'socket.io'
import { verifyJWT } from '@/lib/auth'

// WebSocket event types
export interface WebSocketEvents {
  // Post events
  'post:created': { postId: string; status: string; caption: string }
  'post:updated': { postId: string; status: string; changes: any }
  'post:published': { postId: string; instagramId?: string }
  'post:scheduled': { postId: string; scheduledAt: string }
  'post:failed': { postId: string; error: string }
  
  // Analytics events
  'analytics:updated': { 
    userId: string
    metrics: {
      totalPosts: number
      engagement: number
      reach: number
    }
  }
  
  // Usage events
  'usage:updated': { 
    userId: string
    usage: {
      postsUsed: number
      postsLimit: number
      percentage: number
    }
  }
  
  // System events
  'system:notification': { 
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: string
  }
}

// Room management
export class WebSocketRoomManager {
  private static rooms = new Map<string, Set<string>>()
  
  static joinRoom(socketId: string, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set())
    }
    this.rooms.get(room)!.add(socketId)
  }
  
  static leaveRoom(socketId: string, room: string) {
    if (this.rooms.has(room)) {
      this.rooms.get(room)!.delete(socketId)
      if (this.rooms.get(room)!.size === 0) {
        this.rooms.delete(room)
      }
    }
  }
  
  static getRoomSockets(room: string): string[] {
    return Array.from(this.rooms.get(room) || [])
  }
  
  static getSocketRooms(socketId: string): string[] {
    const rooms: string[] = []
    for (const [room, sockets] of this.rooms.entries()) {
      if (sockets.has(socketId)) {
        rooms.push(room)
      }
    }
    return rooms
  }
  
  static cleanup(socketId: string) {
    for (const room of this.getSocketRooms(socketId)) {
      this.leaveRoom(socketId, room)
    }
  }
}

// WebSocket server instance
let io: Server | null = null

export function getWebSocketServer(): Server | null {
  return io
}

export function initializeWebSocket(httpServer: any): Server {
  if (io) {
    return io
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    upgradeTimeout: 30000,
    pingTimeout: 25000,
    pingInterval: 10000
  })

  // Connection handling
  io.on('connection', async (socket) => {
    console.log(`🔌 WebSocket connected: ${socket.id}`)
    
    try {
      // Authenticate socket connection
      const token = socket.handshake.auth.token
      if (!token) {
        socket.emit('error', { message: '認証トークンが必要です' })
        socket.disconnect()
        return
      }

      const payload = await verifyJWT(token)
      if (!payload || !payload.userId) {
        socket.emit('error', { message: '無効なトークンです' })
        socket.disconnect()
        return
      }

      const userId = String(payload.userId)
      socket.data.userId = userId
      
      // Join user-specific room
      const userRoom = `user:${userId}`
      socket.join(userRoom)
      WebSocketRoomManager.joinRoom(socket.id, userRoom)
      
      console.log(`✅ User ${userId} authenticated and joined room ${userRoom}`)
      
      // Send connection confirmation
      socket.emit('connected', { 
        userId,
        serverTime: new Date().toISOString(),
        rooms: [userRoom]
      })

      // Handle room subscriptions
      socket.on('subscribe', (data: { rooms: string[] }) => {
        const { rooms } = data
        rooms.forEach(room => {
          // Validate room access
          if (room.startsWith(`user:${userId}`) || 
              room === 'global' || 
              room.startsWith('dashboard') ||
              room.startsWith('analytics')) {
            socket.join(room)
            WebSocketRoomManager.joinRoom(socket.id, room)
          }
        })
        
        socket.emit('subscribed', { 
          rooms: WebSocketRoomManager.getSocketRooms(socket.id)
        })
      })

      socket.on('unsubscribe', (data: { rooms: string[] }) => {
        const { rooms } = data
        rooms.forEach(room => {
          socket.leave(room)
          WebSocketRoomManager.leaveRoom(socket.id, room)
        })
        
        socket.emit('unsubscribed', { 
          rooms: data.rooms
        })
      })

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() })
      })

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`❌ Socket ${socket.id} disconnected: ${reason}`)
        WebSocketRoomManager.cleanup(socket.id)
      })

    } catch (error) {
      console.error('❌ WebSocket authentication error:', error)
      socket.emit('error', { message: '認証エラーが発生しました' })
      socket.disconnect()
    }
  })

  // Error handling
  io.on('error', (error) => {
    console.error('❌ WebSocket server error:', error)
  })

  console.log('🚀 WebSocket server initialized')
  return io
}

// Utility functions for emitting events
export class WebSocketEmitter {
  static emit<K extends keyof WebSocketEvents>(
    event: K,
    data: WebSocketEvents[K],
    options: {
      userId?: string
      room?: string
      broadcast?: boolean
    } = {}
  ) {
    const server = getWebSocketServer()
    if (!server) {
      console.warn('⚠️ WebSocket server not initialized')
      return
    }

    const { userId, room, broadcast = false } = options

    if (userId) {
      const userRoom = `user:${userId}`
      server.to(userRoom).emit(event, data)
      console.log(`📡 Emitted ${event} to user ${userId}`)
    } else if (room) {
      server.to(room).emit(event, data)
      console.log(`📡 Emitted ${event} to room ${room}`)
    } else if (broadcast) {
      server.emit(event, data)
      console.log(`📡 Broadcasted ${event} to all clients`)
    }
  }

  static emitToUser(userId: string, event: keyof WebSocketEvents, data: any) {
    this.emit(event, data, { userId })
  }

  static emitToRoom(room: string, event: keyof WebSocketEvents, data: any) {
    this.emit(event, data, { room })
  }

  static broadcast(event: keyof WebSocketEvents, data: any) {
    this.emit(event, data, { broadcast: true })
  }

  // Specific event emitters
  static notifyPostCreated(userId: string, postId: string, status: string, caption: string) {
    this.emitToUser(userId, 'post:created', { postId, status, caption })
  }

  static notifyPostPublished(userId: string, postId: string, instagramId?: string) {
    this.emitToUser(userId, 'post:published', { postId, instagramId })
  }

  static notifyAnalyticsUpdated(userId: string, metrics: any) {
    this.emitToUser(userId, 'analytics:updated', { userId, metrics })
  }

  static notifyUsageUpdated(userId: string, usage: any) {
    this.emitToUser(userId, 'usage:updated', { userId, usage })
  }

  static sendNotification(
    userId: string, 
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string
  ) {
    this.emitToUser(userId, 'system:notification', {
      type,
      title,
      message,
      timestamp: new Date().toISOString()
    })
  }
}

// Rate limiting for WebSocket connections
export class WebSocketRateLimit {
  private static connections = new Map<string, { count: number; lastReset: number }>()
  private static readonly MAX_CONNECTIONS_PER_USER = 5
  private static readonly RESET_INTERVAL = 60 * 1000 // 1 minute

  static checkConnection(userId: string): boolean {
    const now = Date.now()
    const userConnections = this.connections.get(userId)

    if (!userConnections) {
      this.connections.set(userId, { count: 1, lastReset: now })
      return true
    }

    // Reset counter if interval passed
    if (now - userConnections.lastReset > this.RESET_INTERVAL) {
      userConnections.count = 1
      userConnections.lastReset = now
      return true
    }

    // Check if under limit
    if (userConnections.count < this.MAX_CONNECTIONS_PER_USER) {
      userConnections.count++
      return true
    }

    return false
  }

  static removeConnection(userId: string) {
    const userConnections = this.connections.get(userId)
    if (userConnections && userConnections.count > 0) {
      userConnections.count--
    }
  }

  static cleanup() {
    const now = Date.now()
    for (const [userId, data] of this.connections.entries()) {
      if (now - data.lastReset > this.RESET_INTERVAL * 2) {
        this.connections.delete(userId)
      }
    }
  }
}

// Cleanup interval
setInterval(() => {
  WebSocketRateLimit.cleanup()
}, 5 * 60 * 1000) // Every 5 minutes