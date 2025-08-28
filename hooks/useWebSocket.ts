'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io, Socket } from 'socket.io-client';

export interface WebSocketEvents {
  'post:created': { postId: string; status: string; caption: string }
  'post:updated': { postId: string; status: string; changes: any }
  'post:published': { postId: string; instagramId?: string }
  'post:scheduled': { postId: string; scheduledAt: string }
  'post:failed': { postId: string; error: string }
  'analytics:updated': { userId: string; metrics: any }
  'usage:updated': { userId: string; usage: any }
  'system:notification': { 
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: string
  }
}

type WebSocketEventType = keyof WebSocketEvents;
type WebSocketEventHandler<T extends WebSocketEventType> = (data: WebSocketEvents[T]) => void;

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  latency: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const { user, token } = useAuth();
  const { showToast } = useToast();
  
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    connecting: false,
    reconnecting: false,
    error: null,
    reconnectAttempts: 0,
    latency: 0
  });
  
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const lastPingRef = useRef<number>(0);

  // Event handler management
  const addEventListener = useCallback(<T extends WebSocketEventType>(
    event: T,
    handler: WebSocketEventHandler<T>
  ) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);

    // Return cleanup function
    return () => {
      const handlers = eventHandlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(event);
        }
      }
    };
  }, []);

  const removeEventListener = useCallback(<T extends WebSocketEventType>(
    event: T,
    handler: WebSocketEventHandler<T>
  ) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(event);
      }
    }
  }, []);

  // Emit events to handlers
  const emitToHandlers = useCallback((event: string, data: any) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!user || !token || status.connecting || status.connected) {
      return;
    }

    setStatus(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com' 
        : 'ws://localhost:3000';

      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      socketRef.current = socket;

      // Connection successful
      socket.on('connect', () => {
        console.log('🔌 WebSocket connected:', socket.id);
        setStatus(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          reconnecting: false,
          reconnectAttempts: 0,
          error: null
        }));

        // Start ping monitoring
        startPingMonitoring();
      });

      // Authentication confirmed
      socket.on('connected', (data) => {
        console.log('✅ WebSocket authenticated:', data);
        showToast({
          type: 'success',
          title: 'リアルタイム接続',
          message: 'リアルタイム更新が有効になりました'
        });
      });

      // Handle all custom events
      Object.keys({
        'post:created': null,
        'post:updated': null,
        'post:published': null,
        'post:scheduled': null,
        'post:failed': null,
        'analytics:updated': null,
        'usage:updated': null,
        'system:notification': null
      }).forEach(eventName => {
        socket.on(eventName, (data) => {
          console.log(`📨 WebSocket event: ${eventName}`, data);
          emitToHandlers(eventName, data);
          
          // Handle system notifications automatically
          if (eventName === 'system:notification') {
            showToast({
              type: data.type,
              title: data.title,
              message: data.message
            });
          }
        });
      });

      // Handle pong for latency measurement
      socket.on('pong', (data) => {
        if (lastPingRef.current > 0) {
          const latency = Date.now() - lastPingRef.current;
          setStatus(prev => ({ ...prev, latency }));
        }
      });

      // Connection error
      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message
        }));

        if (reconnect && status.reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect();
        } else {
          showToast({
            type: 'error',
            title: '接続エラー',
            message: 'リアルタイム接続に失敗しました'
          });
        }
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));

        stopPingMonitoring();

        // Attempt reconnection for unexpected disconnects
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect automatically
          showToast({
            type: 'warning',
            title: '接続終了',
            message: 'サーバーにより接続が終了されました'
          });
        } else if (reconnect && status.reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect();
        }
      });

      // Server errors
      socket.on('error', (error) => {
        console.error('❌ WebSocket server error:', error);
        setStatus(prev => ({ ...prev, error: error.message }));
        
        showToast({
          type: 'error',
          title: 'サーバーエラー',
          message: error.message
        });
      });

    } catch (error: any) {
      console.error('❌ WebSocket initialization error:', error);
      setStatus(prev => ({
        ...prev,
        connecting: false,
        error: error.message
      }));
    }
  }, [user, token, status.connecting, status.connected, reconnect, maxReconnectAttempts, showToast, emitToHandlers]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    stopPingMonitoring();
    clearReconnectTimeout();
    setStatus(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      reconnecting: false
    }));
  }, []);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    clearReconnectTimeout();
    
    setStatus(prev => ({
      ...prev,
      reconnecting: true,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Attempting WebSocket reconnection (${status.reconnectAttempts + 1}/${maxReconnectAttempts})`);
      connect();
    }, reconnectInterval);
  }, [connect, maxReconnectAttempts, reconnectInterval, status.reconnectAttempts]);

  // Clear reconnection timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  // Start ping monitoring for connection health
  const startPingMonitoring = useCallback(() => {
    if (pingIntervalRef.current) return;

    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        lastPingRef.current = Date.now();
        socketRef.current.emit('ping');
      }
    }, 30000); // Every 30 seconds
  }, []);

  // Stop ping monitoring
  const stopPingMonitoring = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }
  }, []);

  // Subscribe to rooms
  const subscribe = useCallback((rooms: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { rooms });
    }
  }, []);

  // Unsubscribe from rooms
  const unsubscribe = useCallback((rooms: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', { rooms });
    }
  }, []);

  // Auto-connect when component mounts and user is available
  useEffect(() => {
    if (autoConnect && user && token && !status.connected && !status.connecting) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, token, autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      clearReconnectTimeout();
    };
  }, [disconnect, clearReconnectTimeout]);

  return {
    status,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    addEventListener,
    removeEventListener,
    isConnected: status.connected,
    isConnecting: status.connecting,
    latency: status.latency
  };
}

// Convenience hooks for specific events
export function usePostEvents() {
  const webSocket = useWebSocket();
  
  const onPostCreated = useCallback((handler: WebSocketEventHandler<'post:created'>) => {
    return webSocket.addEventListener('post:created', handler);
  }, [webSocket]);

  const onPostPublished = useCallback((handler: WebSocketEventHandler<'post:published'>) => {
    return webSocket.addEventListener('post:published', handler);
  }, [webSocket]);

  const onPostFailed = useCallback((handler: WebSocketEventHandler<'post:failed'>) => {
    return webSocket.addEventListener('post:failed', handler);
  }, [webSocket]);

  return {
    ...webSocket,
    onPostCreated,
    onPostPublished,
    onPostFailed
  };
}

export function useAnalyticsEvents() {
  const webSocket = useWebSocket();
  
  const onAnalyticsUpdated = useCallback((handler: WebSocketEventHandler<'analytics:updated'>) => {
    return webSocket.addEventListener('analytics:updated', handler);
  }, [webSocket]);

  const onUsageUpdated = useCallback((handler: WebSocketEventHandler<'usage:updated'>) => {
    return webSocket.addEventListener('usage:updated', handler);
  }, [webSocket]);

  return {
    ...webSocket,
    onAnalyticsUpdated,
    onUsageUpdated
  };
}