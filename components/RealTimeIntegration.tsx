'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { useIntegratedApi } from '../hooks/useIntegratedApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Wifi, WifiOff, Zap, CheckCircle, XCircle, Clock, 
  RefreshCw, Signal, TrendingUp, Activity, Bell,
  Pause, Play, Settings, Info, AlertCircle, ChevronUp
} from 'lucide-react';

interface RealTimeStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  latency: number;
  lastUpdate: Date | null;
  updateCount: number;
}

interface RealTimeUpdate {
  id: string;
  type: 'post' | 'analytics' | 'usage' | 'system';
  event: string;
  data: any;
  timestamp: Date;
  acknowledged: boolean;
}

interface RealTimeIntegrationProps {
  children: React.ReactNode;
  showStatusIndicator?: boolean;
  enableNotifications?: boolean;
  enableOptimisticUpdates?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Real-time status indicator component
const RealTimeStatusIndicator: React.FC<{
  status: RealTimeStatus;
  position: string;
  onToggle: () => void;
  onSettings: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}> = ({ status, position, onToggle, onSettings, isExpanded, setIsExpanded }) => {
  const getStatusColor = () => {
    if (status.connecting) return 'text-yellow-500';
    if (status.connected) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (status.connecting) return RefreshCw;
    if (status.connected) return status.latency > 0 ? Signal : Wifi;
    return WifiOff;
  };

  const StatusIcon = getStatusIcon();
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`bg-white rounded-full shadow-lg border ${
          isExpanded ? 'rounded-lg p-4 min-w-[200px]' : 'p-3'
        } cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        layout
      >
        {!isExpanded ? (
          // Collapsed status
          <div className="flex items-center space-x-2">
            <StatusIcon 
              className={`w-5 h-5 ${getStatusColor()} ${status.connecting ? 'animate-spin' : ''}`} 
            />
            {status.connected && status.latency > 0 && (
              <span className="text-xs text-gray-500 font-mono">
                {status.latency}ms
              </span>
            )}
          </div>
        ) : (
          // Expanded status
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusIcon 
                  className={`w-5 h-5 ${getStatusColor()} ${status.connecting ? 'animate-spin' : ''}`} 
                />
                <span className="font-medium text-gray-900">リアルタイム</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Status Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">接続状態:</span>
                <span className={`font-medium ${
                  status.connected ? 'text-green-600' : 
                  status.connecting ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {status.connecting ? '接続中' : 
                   status.connected ? '接続済み' : '切断'}
                </span>
              </div>
              
              {status.connected && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">レイテンシ:</span>
                    <span className="font-mono text-gray-900">{status.latency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">更新数:</span>
                    <span className="font-mono text-gray-900">{status.updateCount}</span>
                  </div>
                </>
              )}
              
              {status.lastUpdate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">最終更新:</span>
                  <span className="text-xs text-gray-500">
                    {status.lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Error */}
            {status.error && (
              <div className="p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600">{status.error}</p>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                status.connected 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {status.connected ? '切断' : '接続'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Real-time updates manager component
const RealTimeUpdatesManager: React.FC<{
  updates: RealTimeUpdate[];
  onAcknowledge: (id: string) => void;
  onClearAll: () => void;
}> = ({ updates, onAcknowledge, onClearAll }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const unacknowledgedCount = updates.filter(u => !u.acknowledged).length;

  if (updates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-40 max-w-sm"
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl border"
        layout
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="font-medium">リアルタイム更新</span>
            {unacknowledgedCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {unacknowledgedCount}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>

        {/* Updates List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t"
            >
              <div className="max-h-64 overflow-y-auto">
                {updates.slice(-5).map((update) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 border-b last:border-b-0 ${
                      update.acknowledged ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${
                            update.type === 'post' ? 'bg-green-500' :
                            update.type === 'analytics' ? 'bg-blue-500' :
                            update.type === 'usage' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`} />
                          <span className="text-sm font-medium capitalize">
                            {update.event.replace(':', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {update.timestamp.toLocaleTimeString()}
                        </p>
                        {update.data && (
                          <p className="text-xs text-gray-500 truncate">
                            {JSON.stringify(update.data).substring(0, 50)}...
                          </p>
                        )}
                      </div>
                      {!update.acknowledged && (
                        <button
                          onClick={() => onAcknowledge(update.id)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {updates.length > 5 && (
                <div className="p-2 text-center">
                  <span className="text-xs text-gray-500">
                    {updates.length - 5}件の更新を省略
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={onClearAll}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  すべてクリア
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Main integration component
const RealTimeIntegration: React.FC<RealTimeIntegrationProps> = ({
  children,
  showStatusIndicator = true,
  enableNotifications = true,
  enableOptimisticUpdates = true,
  position = 'top-right'
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clearOptimisticUpdates, performanceMetrics } = useIntegratedApi();
  
  const {
    status: wsStatus,
    connect,
    disconnect,
    addEventListener,
    removeEventListener,
    isConnected,
    latency
  } = useWebSocket({
    autoConnect: true,
    reconnect: true,
    maxReconnectAttempts: 5
  });

  // Real-time status
  const [realTimeStatus, setRealTimeStatus] = useState<RealTimeStatus>({
    connected: false,
    connecting: false,
    error: null,
    latency: 0,
    lastUpdate: null,
    updateCount: 0
  });

  // Real-time updates
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const [settings, setSettings] = useState({
    notifications: enableNotifications,
    optimisticUpdates: enableOptimisticUpdates,
    autoConnect: true
  });

  // Update real-time status
  useEffect(() => {
    setRealTimeStatus(prev => ({
      ...prev,
      connected: isConnected,
      connecting: wsStatus.connecting,
      error: wsStatus.error,
      latency: latency || 0
    }));
  }, [isConnected, wsStatus.connecting, wsStatus.error, latency]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return;

    const eventHandlers = [
      {
        event: 'post:created',
        handler: (data: any) => handleRealTimeUpdate('post', 'post:created', data)
      },
      {
        event: 'post:updated',
        handler: (data: any) => handleRealTimeUpdate('post', 'post:updated', data)
      },
      {
        event: 'post:published',
        handler: (data: any) => handleRealTimeUpdate('post', 'post:published', data)
      },
      {
        event: 'post:failed',
        handler: (data: any) => handleRealTimeUpdate('post', 'post:failed', data)
      },
      {
        event: 'analytics:updated',
        handler: (data: any) => handleRealTimeUpdate('analytics', 'analytics:updated', data)
      },
      {
        event: 'usage:updated',
        handler: (data: any) => handleRealTimeUpdate('usage', 'usage:updated', data)
      },
      {
        event: 'system:notification',
        handler: (data: any) => handleRealTimeUpdate('system', 'system:notification', data)
      }
    ];

    const unsubscribeFunctions = eventHandlers.map(({ event, handler }) => 
      addEventListener(event as any, handler)
    );

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [isConnected, addEventListener]);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((
    type: 'post' | 'analytics' | 'usage' | 'system',
    event: string,
    data: any
  ) => {
    const update: RealTimeUpdate = {
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      event,
      data,
      timestamp: new Date(),
      acknowledged: false
    };

    setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
    
    setRealTimeStatus(prev => ({
      ...prev,
      lastUpdate: new Date(),
      updateCount: prev.updateCount + 1
    }));

    // Show notification if enabled
    if (settings.notifications) {
      const getNotificationConfig = () => {
        switch (event) {
          case 'post:created':
            return { type: 'success' as const, title: '投稿作成', message: '新しい投稿が作成されました' };
          case 'post:published':
            return { type: 'success' as const, title: '投稿公開', message: '投稿が公開されました' };
          case 'post:failed':
            return { type: 'error' as const, title: '投稿失敗', message: '投稿の処理に失敗しました' };
          case 'analytics:updated':
            return { type: 'info' as const, title: 'アナリティクス更新', message: '分析データが更新されました' };
          case 'usage:updated':
            return { type: 'info' as const, title: '使用量更新', message: '使用量データが更新されました' };
          default:
            return { type: 'info' as const, title: 'リアルタイム更新', message: 'データが更新されました' };
        }
      };

      const config = getNotificationConfig();
      showToast(config);
    }
  }, [settings.notifications, showToast]);

  // Toggle connection
  const handleToggleConnection = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  // Settings modal (simplified)
  const handleSettings = useCallback(() => {
    // In a real implementation, this would open a settings modal
    console.log('Settings clicked - implement settings modal');
  }, []);

  // Acknowledge update
  const handleAcknowledgeUpdate = useCallback((id: string) => {
    setUpdates(prev => 
      prev.map(update => 
        update.id === id ? { ...update, acknowledged: true } : update
      )
    );
  }, []);

  // Clear all updates
  const handleClearAllUpdates = useCallback(() => {
    setUpdates([]);
    setRealTimeStatus(prev => ({ ...prev, updateCount: 0 }));
  }, []);

  // Provide enhanced context
  const enhancedContext = useMemo(() => ({
    realTime: {
      connected: isConnected,
      status: realTimeStatus,
      updates,
      settings,
      performance: performanceMetrics
    }
  }), [isConnected, realTimeStatus, updates, settings, performanceMetrics]);

  return (
    <>
      {children}
      
      {/* Real-time Status Indicator */}
      {showStatusIndicator && (
        <RealTimeStatusIndicator
          status={realTimeStatus}
          position={position}
          onToggle={handleToggleConnection}
          onSettings={handleSettings}
          isExpanded={isStatusExpanded}
          setIsExpanded={setIsStatusExpanded}
        />
      )}

      {/* Real-time Updates Manager */}
      <RealTimeUpdatesManager
        updates={updates}
        onAcknowledge={handleAcknowledgeUpdate}
        onClearAll={handleClearAllUpdates}
      />
    </>
  );
};

export default RealTimeIntegration;

// Helper component to wrap existing components with real-time capabilities
export const withRealTimeIntegration = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    showStatusIndicator?: boolean;
    enableNotifications?: boolean;
    enableOptimisticUpdates?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  } = {}
) => {
  return (props: P) => (
    <RealTimeIntegration {...options}>
      <Component {...props} />
    </RealTimeIntegration>
  );
};

// Export types
export type { RealTimeStatus, RealTimeUpdate };