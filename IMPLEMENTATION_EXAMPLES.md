# Implementation Examples
## 実装サンプル集 - Frontend Backend Integration

## 📚 目次

1. [完全な統合コンポーネント例](#完全な統合コンポーネント例)
2. [カスタムフック実装例](#カスタムフック実装例)
3. [エラーハンドリング実装例](#エラーハンドリング実装例)
4. [パフォーマンス最適化例](#パフォーマンス最適化例)
5. [テスト実装例](#テスト実装例)

## 🔧 完全な統合コンポーネント例

### 統合投稿管理コンポーネント

```typescript
// components/IntegratedPostManager.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntegratedApi } from '@/hooks/useIntegratedApi';
import { 
  useProgressiveEnhancement, 
  AdaptiveAnimation, 
  ProgressiveImage 
} from '@/components/ProgressiveEnhancement';
import RealTimeIntegration from '@/components/RealTimeIntegration';
import EnhancedErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/context/ToastContext';
import { 
  Plus, Edit, Trash2, Eye, Clock, CheckCircle, 
  AlertCircle, TrendingUp, MoreHorizontal 
} from 'lucide-react';

interface Post {
  id: string;
  caption: string;
  image_url?: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
  created_at: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const IntegratedPostManager: React.FC = () => {
  const { useOptimisticPosts, useBatchOperations } = useIntegratedApi();
  const { preferences, features, capabilities } = useProgressiveEnhancement();
  const { showToast } = useToast();

  // 統合API使用
  const {
    posts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
    isCreating,
    isUpdating,
    isDeleting,
    hasOptimisticUpdates
  } = useOptimisticPosts({
    fields: ['id', 'caption', 'image_url', 'status', 'scheduled_at', 'engagement'],
    include: ['analytics'],
    compress: true,
    optimistic: preferences.optimisticUI
  });

  // バッチ操作
  const { executeBatch, isProcessing, progress } = useBatchOperations();

  // ローカル状態
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [isGridView, setIsGridView] = useState(!capabilities.isMobile);

  // フィルタされた投稿
  const filteredPosts = React.useMemo(() => {
    return posts.filter(post => 
      filterStatus === 'all' || post.status === filterStatus
    );
  }, [posts, filterStatus]);

  // 投稿作成
  const handleCreatePost = useCallback(async (postData: Partial<Post>) => {
    try {
      await createPost({
        ...postData,
        status: 'draft',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  }, [createPost]);

  // 投稿編集
  const handleEditPost = useCallback(async (id: string, data: Partial<Post>) => {
    try {
      await updatePost({ id, data });
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  }, [updatePost]);

  // 投稿削除
  const handleDeletePost = useCallback(async (id: string) => {
    if (!confirm('この投稿を削除しますか？')) return;
    
    try {
      await deletePost(id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }, [deletePost]);

  // バッチ削除
  const handleBatchDelete = useCallback(async () => {
    if (selectedPosts.length === 0) {
      showToast({
        type: 'warning',
        title: '選択エラー',
        message: '削除する投稿を選択してください'
      });
      return;
    }

    if (!confirm(`${selectedPosts.length}件の投稿を削除しますか？`)) return;

    const operations = selectedPosts.map(id => ({
      operation: 'delete' as const,
      id
    }));

    try {
      await executeBatch({ 
        operations,
        transactional: true,
        progressCallback: (current, total, operation) => {
          console.log(`Progress: ${current}/${total} - ${operation}`);
        }
      });
      setSelectedPosts([]);
    } catch (error) {
      console.error('Batch delete failed:', error);
    }
  }, [selectedPosts, executeBatch, showToast]);

  // 投稿選択切り替え
  const handleToggleSelect = useCallback((postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  }, []);

  // すべて選択/解除
  const handleToggleSelectAll = useCallback(() => {
    setSelectedPosts(prev => 
      prev.length === filteredPosts.length 
        ? [] 
        : filteredPosts.map(post => post.id)
    );
  }, [filteredPosts]);

  // ステータスアイコン
  const getStatusIcon = (status: Post['status']) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'draft': return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // レンダリング
  return (
    <RealTimeIntegration
      showStatusIndicator={capabilities.isDesktop}
      enableNotifications={preferences.notifications}
      enableOptimisticUpdates={preferences.optimisticUI}
    >
      <EnhancedErrorBoundary
        level="component"
        showDetails={process.env.NODE_ENV === 'development'}
        maxRetries={3}
      >
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">投稿管理</h1>
                <p className="text-gray-600 mt-1">
                  {posts.length}件の投稿 
                  {hasOptimisticUpdates && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      同期中
                    </span>
                  )}
                </p>
              </div>

              {/* アクションボタン */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleCreatePost({ caption: '新しい投稿', status: 'draft' })}
                  disabled={isCreating}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新規作成
                </button>

                {selectedPosts.length > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    disabled={isProcessing}
                    className="btn-danger"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isProcessing ? `削除中 (${progress.current}/${progress.total})` : `${selectedPosts.length}件削除`}
                  </button>
                )}
              </div>
            </div>

            {/* フィルターと表示切り替え */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">フィルター:</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="input-sm"
                >
                  <option value="all">すべて</option>
                  <option value="draft">下書き</option>
                  <option value="scheduled">予約済み</option>
                  <option value="published">公開済み</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                    onChange={handleToggleSelectAll}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">すべて選択</span>
                </label>

                {capabilities.isDesktop && (
                  <div className="flex items-center space-x-1 border rounded-lg p-1">
                    <button
                      onClick={() => setIsGridView(true)}
                      className={`p-1 rounded ${isGridView ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsGridView(false)}
                      className={`p-1 rounded ${!isGridView ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 投稿一覧 */}
          <AdaptiveAnimation animation="fade">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg border p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-32 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={
                isGridView 
                  ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                <AnimatePresence>
                  {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all ${
                        selectedPosts.includes(post.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="p-6">
                        {/* 投稿ヘッダー */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedPosts.includes(post.id)}
                              onChange={() => handleToggleSelect(post.id)}
                              className="rounded text-blue-600"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(post.status)}
                                <span className="text-sm font-medium capitalize">
                                  {post.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(post.created_at).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditPost(post.id, { caption: `${post.caption} (編集済み)` })}
                              disabled={isUpdating}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={isDeleting}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* 投稿コンテンツ */}
                        <div className="space-y-4">
                          <p className="text-gray-900 leading-relaxed">
                            {post.caption.length > 100 
                              ? `${post.caption.substring(0, 100)}...` 
                              : post.caption
                            }
                          </p>

                          {post.image_url && (
                            <ProgressiveImage
                              src={post.image_url}
                              alt="投稿画像"
                              className="w-full h-48 rounded-lg"
                              quality={preferences.reducedData ? 'low' : 'auto'}
                            />
                          )}

                          {/* エンゲージメント */}
                          {post.engagement && (
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>👍 {post.engagement.likes}</span>
                                <span>💬 {post.engagement.comments}</span>
                                <span>🔄 {post.engagement.shares}</span>
                              </div>
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </AdaptiveAnimation>
        </div>
      </EnhancedErrorBoundary>
    </RealTimeIntegration>
  );
};

export default IntegratedPostManager;
```

## 🎣 カスタムフック実装例

### リアルタイム通知フック

```typescript
// hooks/useRealTimeNotifications.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { useToast } from '../context/ToastContext';

interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  vibration: boolean;
}

export const useRealTimeNotifications = (config: NotificationConfig = {
  enabled: true,
  sound: true,
  desktop: false,
  vibration: false
}) => {
  const { addEventListener, removeEventListener, isConnected } = useWebSocket();
  const { showToast } = useToast();
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);

  // デスクトップ通知の許可要求
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // サウンド再生
  const playNotificationSound = useCallback(() => {
    if (!config.sound) return;
    
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // サウンド再生失敗は無視
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [config.sound]);

  // バイブレーション
  const vibrate = useCallback(() => {
    if (!config.vibration || !navigator.vibrate) return;
    navigator.vibrate(200);
  }, [config.vibration]);

  // デスクトップ通知表示
  const showDesktopNotification = useCallback(async (title: string, message: string) => {
    if (!config.desktop) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    
    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/badge-72x72.png',
      tag: 'instagram-automation',
      requireInteraction: false
    });
    
    setTimeout(() => notification.close(), 5000);
  }, [config.desktop, requestNotificationPermission]);

  // 通知処理
  const handleNotification = useCallback(async (type: string, data: any) => {
    if (!config.enabled) return;

    const notificationConfig = getNotificationConfig(type, data);
    
    // Toast通知
    showToast(notificationConfig.toast);
    
    // サウンド
    if (notificationConfig.priority === 'high') {
      playNotificationSound();
    }
    
    // バイブレーション
    if (notificationConfig.priority === 'urgent') {
      vibrate();
    }
    
    // デスクトップ通知
    if (notificationConfig.desktop) {
      await showDesktopNotification(
        notificationConfig.toast.title,
        notificationConfig.toast.message
      );
    }

    // 通知キューに追加
    setNotificationQueue(prev => [
      ...prev.slice(-9), // 最新10件のみ保持
      {
        id: `notification_${Date.now()}`,
        type,
        data,
        timestamp: new Date(),
        ...notificationConfig
      }
    ]);
  }, [config, showToast, playNotificationSound, vibrate, showDesktopNotification]);

  // 通知設定の取得
  const getNotificationConfig = (type: string, data: any) => {
    switch (type) {
      case 'post:published':
        return {
          priority: 'high' as const,
          desktop: true,
          toast: {
            type: 'success' as const,
            title: '投稿公開完了',
            message: '投稿がInstagramに公開されました'
          }
        };
      
      case 'post:failed':
        return {
          priority: 'urgent' as const,
          desktop: true,
          toast: {
            type: 'error' as const,
            title: '投稿失敗',
            message: data.error || '投稿の処理に失敗しました'
          }
        };
      
      case 'analytics:milestone':
        return {
          priority: 'medium' as const,
          desktop: config.desktop,
          toast: {
            type: 'success' as const,
            title: 'マイルストーン達成',
            message: `${data.metric}が${data.value}に達しました！`
          }
        };
      
      default:
        return {
          priority: 'low' as const,
          desktop: false,
          toast: {
            type: 'info' as const,
            title: 'お知らせ',
            message: 'データが更新されました'
          }
        };
    }
  };

  // WebSocketイベントリスナー設定
  useEffect(() => {
    if (!isConnected) return;

    const eventTypes = [
      'post:created',
      'post:published', 
      'post:failed',
      'analytics:milestone',
      'system:notification'
    ];

    const unsubscribeFunctions = eventTypes.map(eventType => 
      addEventListener(eventType as any, (data) => handleNotification(eventType, data))
    );

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [isConnected, addEventListener, handleNotification]);

  // 通知をクリア
  const clearNotifications = useCallback(() => {
    setNotificationQueue([]);
  }, []);

  // 未読通知数
  const unreadCount = notificationQueue.filter(n => !n.read).length;

  return {
    notifications: notificationQueue,
    unreadCount,
    clearNotifications,
    requestNotificationPermission,
    isConnected
  };
};
```

## 🚨 エラーハンドリング実装例

### グローバルエラーハンドラー

```typescript
// lib/errorHandler.ts
export interface ErrorReport {
  errorId: string;
  timestamp: number;
  message: string;
  stack?: string;
  component?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  additionalInfo?: Record<string, any>;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isReporting = false;

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  // エラー報告
  reportError(
    error: Error, 
    component?: string, 
    additionalInfo?: Record<string, any>
  ): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: ErrorReport = {
      errorId,
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      component,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      additionalInfo
    };

    // ローカルストレージに保存
    this.storeErrorLocally(report);
    
    // エラーキューに追加
    this.errorQueue.push(report);
    
    // 報告処理開始
    this.processErrorQueue();
    
    return errorId;
  }

  // エラーキューの処理
  private async processErrorQueue() {
    if (this.isReporting || this.errorQueue.length === 0) return;
    
    this.isReporting = true;
    
    try {
      const errors = [...this.errorQueue];
      this.errorQueue = [];
      
      await this.sendErrorReports(errors);
    } catch (error) {
      console.error('Failed to send error reports:', error);
      // 送信失敗時はキューに戻す
      this.errorQueue.unshift(...this.errorQueue);
    } finally {
      this.isReporting = false;
    }
  }

  // エラー報告送信
  private async sendErrorReports(errors: ErrorReport[]) {
    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // 送信成功時はローカルストレージから削除
      errors.forEach(error => {
        localStorage.removeItem(`error_${error.errorId}`);
      });
      
    } catch (error) {
      console.error('Error reporting failed:', error);
      throw error;
    }
  }

  // ローカルエラー保存
  private storeErrorLocally(report: ErrorReport) {
    try {
      localStorage.setItem(
        `error_${report.errorId}`, 
        JSON.stringify(report)
      );
      
      // 古いエラーレポートのクリーンアップ（7日以上前）
      this.cleanupOldErrors();
    } catch (error) {
      console.warn('Failed to store error locally:', error);
    }
  }

  // 古いエラーのクリーンアップ
  private cleanupOldErrors() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('error_')) {
        try {
          const report = JSON.parse(localStorage.getItem(key) || '');
          if (report.timestamp < oneWeekAgo) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // 無効なデータは削除
          localStorage.removeItem(key);
        }
      }
    }
  }

  private getCurrentUserId(): string | undefined {
    // AuthContextから取得する実装
    try {
      const authData = localStorage.getItem('auth_user');
      return authData ? JSON.parse(authData).id : undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}

// グローバルエラーハンドラーの設定
export const setupGlobalErrorHandler = () => {
  const errorHandler = GlobalErrorHandler.getInstance();
  
  // 未処理のPromise拒否
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.reportError(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      'Promise',
      { reason: event.reason }
    );
  });
  
  // 未処理のエラー
  window.addEventListener('error', (event) => {
    errorHandler.reportError(
      new Error(event.message),
      'Global',
      { 
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });

  return errorHandler;
};
```

## ⚡ パフォーマンス最適化例

### 仮想化リスト実装

```typescript
// components/VirtualizedPostList.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useProgressiveEnhancement } from '@/components/ProgressiveEnhancement';

interface Post {
  id: string;
  caption: string;
  image_url?: string;
  created_at: string;
}

interface VirtualizedPostListProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const ITEM_HEIGHT = 120;

const PostItem: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: { posts: Post[]; onPostClick: (post: Post) => void };
}> = ({ index, style, data }) => {
  const post = data.posts[index];
  const { preferences } = useProgressiveEnhancement();

  return (
    <div style={style} className="px-4">
      <div 
        className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => data.onPostClick(post)}
      >
        <div className="flex items-start space-x-4">
          {post.image_url && (
            <img
              src={preferences.reducedData ? post.image_url.replace('.jpg', '_thumb.jpg') : post.image_url}
              alt="投稿画像"
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 line-clamp-2">
              {post.caption}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(post.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const VirtualizedPostList: React.FC<VirtualizedPostListProps> = ({
  posts,
  onPostClick
}) => {
  const { capabilities } = useProgressiveEnhancement();
  const [listHeight, setListHeight] = useState(600);

  // デバイスに応じた高さ調整
  const adjustedHeight = useMemo(() => {
    if (capabilities.isMobile) return Math.min(listHeight, window.innerHeight - 200);
    return listHeight;
  }, [listHeight, capabilities.isMobile]);

  // アイテムデータ
  const itemData = useMemo(() => ({
    posts,
    onPostClick
  }), [posts, onPostClick]);

  return (
    <div className="bg-gray-50 rounded-xl">
      <List
        height={adjustedHeight}
        itemCount={posts.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        overscanCount={5}
      >
        {PostItem}
      </List>
    </div>
  );
};

export default VirtualizedPostList;
```

## 🧪 テスト実装例

### 統合テスト例

```typescript
// __tests__/integration/PostManager.integration.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressiveEnhancementProvider } from '@/components/ProgressiveEnhancement';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import IntegratedPostManager from '@/components/IntegratedPostManager';

// モックデータ
const mockPosts = [
  {
    id: '1',
    caption: 'テスト投稿1',
    status: 'published' as const,
    created_at: '2024-01-01T00:00:00Z',
    engagement: { likes: 10, comments: 5, shares: 2 }
  },
  {
    id: '2',
    caption: 'テスト投稿2',
    status: 'draft' as const,
    created_at: '2024-01-02T00:00:00Z'
  }
];

// モックAPI
jest.mock('@/hooks/useIntegratedApi', () => ({
  useIntegratedApi: () => ({
    useOptimisticPosts: () => ({
      posts: mockPosts,
      isLoading: false,
      createPost: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      hasOptimisticUpdates: false
    }),
    useBatchOperations: () => ({
      executeBatch: jest.fn(),
      isProcessing: false,
      progress: { current: 0, total: 0, operation: '' }
    })
  })
}));

// テストラッパー
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ProgressiveEnhancementProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </ProgressiveEnhancementProvider>
    </QueryClientProvider>
  );
};

describe('IntegratedPostManager Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('投稿一覧が正しく表示される', async () => {
    render(
      <TestWrapper>
        <IntegratedPostManager />
      </TestWrapper>
    );

    // ヘッダーの確認
    expect(screen.getByText('投稿管理')).toBeInTheDocument();
    expect(screen.getByText('2件の投稿')).toBeInTheDocument();

    // 投稿の確認
    await waitFor(() => {
      expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      expect(screen.getByText('テスト投稿2')).toBeInTheDocument();
    });

    // ステータスの確認
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();

    // エンゲージメントの確認
    expect(screen.getByText('👍 10')).toBeInTheDocument();
    expect(screen.getByText('💬 5')).toBeInTheDocument();
  });

  test('フィルターが正しく機能する', async () => {
    render(
      <TestWrapper>
        <IntegratedPostManager />
      </TestWrapper>
    );

    // フィルターセレクトボックスを取得
    const filterSelect = screen.getByDisplayValue('すべて');
    
    // 下書きフィルターを選択
    fireEvent.change(filterSelect, { target: { value: 'draft' } });

    await waitFor(() => {
      expect(screen.getByText('テスト投稿2')).toBeInTheDocument();
      expect(screen.queryByText('テスト投稿1')).not.toBeInTheDocument();
    });

    // 公開済みフィルターを選択
    fireEvent.change(filterSelect, { target: { value: 'published' } });

    await waitFor(() => {
      expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      expect(screen.queryByText('テスト投稿2')).not.toBeInTheDocument();
    });
  });

  test('投稿選択とバッチ操作が機能する', async () => {
    const { useIntegratedApi } = require('@/hooks/useIntegratedApi');
    const mockExecuteBatch = jest.fn();
    
    useIntegratedApi.mockReturnValue({
      useOptimisticPosts: () => ({
        posts: mockPosts,
        isLoading: false,
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
        hasOptimisticUpdates: false
      }),
      useBatchOperations: () => ({
        executeBatch: mockExecuteBatch,
        isProcessing: false,
        progress: { current: 0, total: 0, operation: '' }
      })
    });

    render(
      <TestWrapper>
        <IntegratedPostManager />
      </TestWrapper>
    );

    // 投稿を選択
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // 最初のチェックボックスは「すべて選択」

    // バッチ削除ボタンが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('1件削除')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByText('1件削除');
    
    // 確認ダイアログのモック
    window.confirm = jest.fn(() => true);
    
    fireEvent.click(deleteButton);

    // バッチ削除関数が呼ばれることを確認
    await waitFor(() => {
      expect(mockExecuteBatch).toHaveBeenCalledWith({
        operations: [{ operation: 'delete', id: '1' }],
        transactional: true,
        progressCallback: expect.any(Function)
      });
    });
  });
});
```

---

これらの実装例により、統合されたシステムの全機能を活用した堅牢で高性能なアプリケーションを構築できます。