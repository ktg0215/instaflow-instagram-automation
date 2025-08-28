'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWebSocket } from './useWebSocket';

// Enhanced API types with optimistic updates
interface OptimizedApiOptions {
  fields?: string[];
  include?: string[];
  compress?: boolean;
  cache?: boolean;
  timeout?: number;
  optimistic?: boolean;
  revalidate?: boolean;
}

interface ApiResponse<T> {
  data: T;
  metadata?: any;
  optimization?: {
    compressed: boolean;
    compressionRatio?: string;
    cached: boolean;
    responseTime: number;
    fieldsSelected: string[];
  };
  pagination?: {
    hasNext: boolean;
    cursor?: string;
    total?: number;
  };
}

interface BatchOperation {
  operation: 'create' | 'update' | 'delete' | 'publish' | 'schedule';
  data: any;
  id?: string;
  optimisticId?: string;
}

interface OptimisticUpdate<T> {
  id: string;
  data: T;
  operation: string;
  timestamp: number;
  reverted?: boolean;
}

// Enhanced fetch with comprehensive error handling and optimization
async function enhancedFetch<T>(
  endpoint: string,
  options: RequestInit & { optimize?: OptimizedApiOptions } = {}
): Promise<ApiResponse<T>> {
  const { optimize = {}, ...fetchOptions } = options;
  
  // Build query parameters for optimization
  const params = new URLSearchParams();
  if (optimize.fields?.length) {
    params.set('fields', optimize.fields.join(','));
  }
  if (optimize.include?.length) {
    params.set('include', optimize.include.join(','));
  }
  if (optimize.compress) {
    params.set('compress', 'true');
  }
  if (optimize.cache) {
    params.set('cache', 'true');
  }

  const url = `${endpoint}${params.toString() ? `?${params}` : ''}`;
  const startTime = Date.now();

  // Add optimized headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...fetchOptions.headers
  };

  const controller = new AbortController();
  const timeoutId = optimize.timeout 
    ? setTimeout(() => controller.abort(), optimize.timeout)
    : null;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        // HTML response or invalid JSON - use default message
      }
      
      const apiError = new Error(errorMessage);
      (apiError as any).status = response.status;
      (apiError as any).code = response.status >= 500 ? 'SERVER_ERROR' : 
                                response.status === 429 ? 'RATE_LIMIT' :
                                response.status === 401 ? 'UNAUTHORIZED' : 'API_ERROR';
      throw apiError;
    }

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    return {
      data,
      metadata: data.metadata,
      optimization: {
        compressed: response.headers.get('X-Compression-Ratio') !== null,
        compressionRatio: response.headers.get('X-Compression-Ratio') || undefined,
        cached: response.headers.get('X-Cache') === 'HIT',
        responseTime,
        fieldsSelected: optimize.fields || []
      },
      pagination: data.pagination
    };
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'TIMEOUT';
      throw timeoutError;
    }
    
    // Network error
    if (!error.status) {
      error.code = 'NETWORK_ERROR';
    }
    
    throw error;
  }
}

// Optimistic updates manager
class OptimisticUpdatesManager<T> {
  private updates = new Map<string, OptimisticUpdate<T>>();
  private listeners: Set<() => void> = new Set();

  addUpdate(id: string, data: T, operation: string) {
    this.updates.set(id, {
      id,
      data,
      operation,
      timestamp: Date.now()
    });
    this.notifyListeners();
  }

  removeUpdate(id: string) {
    this.updates.delete(id);
    this.notifyListeners();
  }

  revertUpdate(id: string) {
    const update = this.updates.get(id);
    if (update) {
      update.reverted = true;
      this.notifyListeners();
    }
  }

  getUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values()).filter(u => !u.reverted);
  }

  applyUpdates(data: T[]): T[] {
    const updates = this.getUpdates();
    if (updates.length === 0) return data;

    let result = [...data];
    
    updates.forEach(update => {
      switch (update.operation) {
        case 'create':
          result = [update.data, ...result];
          break;
        case 'update':
          const index = result.findIndex((item: any) => item.id === update.id);
          if (index !== -1) {
            result[index] = { ...result[index], ...update.data };
          }
          break;
        case 'delete':
          result = result.filter((item: any) => item.id !== update.id);
          break;
      }
    });

    return result;
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  clear() {
    this.updates.clear();
    this.notifyListeners();
  }
}

// Main integrated API hook
export function useIntegratedApi() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { isConnected: wsConnected, addEventListener, removeEventListener } = useWebSocket();
  const queryClient = useQueryClient();
  
  // Optimistic updates manager
  const optimisticManager = useRef(new OptimisticUpdatesManager()).current;
  const [optimisticUpdates, setOptimisticUpdates] = useState(0);

  // Subscribe to optimistic updates changes
  useState(() => {
    return optimisticManager.subscribe(() => {
      setOptimisticUpdates(prev => prev + 1);
    });
  }, []);

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageResponseTime: 0,
    cacheHitRate: 0,
    compressionSavings: 0,
    totalRequests: 0,
    errorRate: 0
  });

  const recordMetrics = useCallback((optimization: any, hasError = false) => {
    if (!optimization && !hasError) return;

    setPerformanceMetrics(prev => {
      const newTotal = prev.totalRequests + 1;
      const newAverage = optimization 
        ? (prev.averageResponseTime * prev.totalRequests + optimization.responseTime) / newTotal
        : prev.averageResponseTime;
      const hitCount = optimization?.cached ? 1 : 0;
      const newCacheHitRate = (prev.cacheHitRate * prev.totalRequests + hitCount) / newTotal;
      const errorCount = hasError ? 1 : 0;
      const newErrorRate = (prev.errorRate * prev.totalRequests + errorCount) / newTotal;

      return {
        averageResponseTime: Math.round(newAverage),
        cacheHitRate: Math.round(newCacheHitRate * 100),
        compressionSavings: optimization?.compressionRatio ? 
          parseInt(optimization.compressionRatio.replace('%', '')) : prev.compressionSavings,
        totalRequests: newTotal,
        errorRate: Math.round(newErrorRate * 100)
      };
    });
  }, []);

  // Enhanced posts hook with optimistic updates
  const useOptimisticPosts = useCallback((options: OptimizedApiOptions = {}) => {
    const defaultOptions = useMemo(() => ({
      fields: ['id', 'caption', 'status', 'created_at', 'scheduled_at', 'image_url'],
      include: ['engagement', 'analytics'],
      compress: true,
      optimistic: true,
      ...options
    }), [options]);

    const {
      data: postsResponse,
      isLoading,
      error,
      refetch,
      isRefetching
    } = useQuery({
      queryKey: ['posts', 'integrated', defaultOptions],
      queryFn: async () => {
        try {
          const response = await enhancedFetch<any>('/api/v2/posts', {
            headers: { Authorization: `Bearer ${token}` },
            optimize: defaultOptions
          });
          recordMetrics(response.optimization);
          return response;
        } catch (error: any) {
          recordMetrics(null, true);
          throw error;
        }
      },
      enabled: !!token,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error.code === 'UNAUTHORIZED') return false;
        if (error.code === 'RATE_LIMIT') return failureCount < 2;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    });

    // Apply optimistic updates
    const posts = useMemo(() => {
      const basePosts = postsResponse?.data?.posts || [];
      return defaultOptions.optimistic 
        ? optimisticManager.applyUpdates(basePosts)
        : basePosts;
    }, [postsResponse, defaultOptions.optimistic, optimisticUpdates]);

    // Create post with optimistic update
    const createPostMutation = useMutation({
      mutationFn: async (postData: any) => {
        const optimisticId = `optimistic_${Date.now()}`;
        
        // Optimistic update
        if (defaultOptions.optimistic) {
          const optimisticPost = {
            id: optimisticId,
            ...postData,
            created_at: new Date().toISOString(),
            status: postData.status || 'published',
            engagement: { likes: 0, comments: 0, shares: 0 }
          };
          
          optimisticManager.addUpdate(optimisticId, optimisticPost, 'create');
          
          showToast({
            type: 'info',
            title: '投稿を作成中',
            message: '投稿を送信しています...'
          });
        }

        try {
          const response = await enhancedFetch<any>('/api/v2/posts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ posts: [{ ...postData, optimisticId }] }),
            optimize: { compress: true, timeout: 30000 }
          });
          
          recordMetrics(response.optimization);
          
          // Remove optimistic update
          if (defaultOptions.optimistic) {
            optimisticManager.removeUpdate(optimisticId);
          }
          
          return response;
        } catch (error: any) {
          recordMetrics(null, true);
          
          // Revert optimistic update
          if (defaultOptions.optimistic) {
            optimisticManager.revertUpdate(optimisticId);
          }
          
          throw error;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        
        showToast({
          type: 'success',
          title: '投稿作成完了',
          message: '投稿が正常に作成されました'
        });
      },
      onError: (error: any) => {
        const errorMessage = error.code === 'TIMEOUT' ? '投稿の送信がタイムアウトしました' :
                           error.code === 'NETWORK_ERROR' ? 'ネットワークエラーが発生しました' :
                           error.code === 'RATE_LIMIT' ? 'レート制限に達しました。しばらく待ってから再試行してください' :
                           error.message || '投稿の作成に失敗しました';

        showToast({
          type: 'error',
          title: '投稿作成失敗',
          message: errorMessage
        });
      }
    });

    // Update post with optimistic update
    const updatePostMutation = useMutation({
      mutationFn: async ({ id, data: updateData }: { id: string; data: any }) => {
        // Optimistic update
        if (defaultOptions.optimistic) {
          optimisticManager.addUpdate(id, updateData, 'update');
        }

        try {
          const response = await enhancedFetch<any>(`/api/v2/posts/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(updateData),
            optimize: { compress: true }
          });
          
          recordMetrics(response.optimization);
          
          // Remove optimistic update
          if (defaultOptions.optimistic) {
            optimisticManager.removeUpdate(id);
          }
          
          return response;
        } catch (error: any) {
          recordMetrics(null, true);
          
          // Revert optimistic update
          if (defaultOptions.optimistic) {
            optimisticManager.revertUpdate(id);
          }
          
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        showToast({
          type: 'success',
          title: '投稿更新完了',
          message: '投稿が正常に更新されました'
        });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          title: '投稿更新失敗',
          message: error.message
        });
      }
    });

    // Delete post with optimistic update
    const deletePostMutation = useMutation({
      mutationFn: async (id: string) => {
        // Optimistic update
        if (defaultOptions.optimistic) {
          optimisticManager.addUpdate(id, null, 'delete');
        }

        try {
          const response = await enhancedFetch<any>(`/api/v2/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            optimize: { timeout: 15000 }
          });
          
          recordMetrics(response.optimization);
          
          // Remove optimistic update
          if (defaultOptions.optimistic) {
            optimisticManager.removeUpdate(id);
          }
          
          return response;
        } catch (error: any) {
          recordMetrics(null, true);
          
          // Revert optimistic update
          if (defaultOptions.optimistic) {
            optimisticManager.revertUpdate(id);
          }
          
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        showToast({
          type: 'success',
          title: '投稿削除完了',
          message: '投稿が削除されました'
        });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          title: '投稿削除失敗',
          message: error.message
        });
      }
    });

    return {
      posts,
      isLoading,
      isRefetching,
      error,
      refetch,
      createPost: createPostMutation.mutate,
      updatePost: updatePostMutation.mutate,
      deletePost: deletePostMutation.mutate,
      isCreating: createPostMutation.isPending,
      isUpdating: updatePostMutation.isPending,
      isDeleting: deletePostMutation.isPending,
      optimization: postsResponse?.optimization,
      hasOptimisticUpdates: optimisticManager.getUpdates().length > 0
    };
  }, [token, showToast, queryClient, optimisticUpdates, recordMetrics]);

  // Enhanced dashboard data with real-time updates
  const useDashboardData = useCallback((refresh = false) => {
    const {
      data: dashboardResponse,
      isLoading,
      error,
      refetch
    } = useQuery({
      queryKey: ['dashboard', 'integrated'],
      queryFn: async () => {
        try {
          const response = await enhancedFetch<any>('/api/v2/dashboard', {
            headers: { Authorization: `Bearer ${token}` },
            optimize: { 
              compress: true, 
              cache: !refresh,
              fields: ['stats', 'recent_posts', 'analytics', 'usage'],
              include: ['engagement', 'performance']
            }
          });
          recordMetrics(response.optimization);
          return response;
        } catch (error: any) {
          recordMetrics(null, true);
          throw error;
        }
      },
      enabled: !!token,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3
    });

    // Set up real-time updates
    useState(() => {
      if (wsConnected) {
        const unsubscribeAnalytics = addEventListener('analytics:updated', (data) => {
          queryClient.setQueryData(['dashboard', 'integrated'], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                analytics: data.metrics
              }
            };
          });
        });

        const unsubscribeUsage = addEventListener('usage:updated', (data) => {
          queryClient.setQueryData(['dashboard', 'integrated'], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                usage: data.usage
              }
            };
          });
        });

        return () => {
          unsubscribeAnalytics();
          unsubscribeUsage();
        };
      }
    }, [wsConnected]);

    return {
      dashboard: dashboardResponse?.data,
      isLoading,
      error,
      refetch,
      optimization: dashboardResponse?.optimization,
      isRealTime: wsConnected
    };
  }, [token, wsConnected, queryClient, addEventListener, recordMetrics]);

  // Batch operations with progress tracking
  const useBatchOperations = useCallback(() => {
    const [progress, setProgress] = useState({ current: 0, total: 0, operation: '' });

    const batchMutation = useMutation({
      mutationFn: async ({ 
        operations, 
        transactional = false,
        progressCallback 
      }: { 
        operations: BatchOperation[], 
        transactional?: boolean,
        progressCallback?: (current: number, total: number, operation: string) => void
      }) => {
        setProgress({ current: 0, total: operations.length, operation: 'Starting...' });
        progressCallback?.(0, operations.length, 'Starting batch operation...');

        try {
          const response = await enhancedFetch<any>('/api/v2/batch', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              operations, 
              transactional, 
              notify: true,
              progress: true
            }),
            optimize: { 
              timeout: 60000, // 1 minute timeout for batch operations
              compress: true
            }
          });

          recordMetrics(response.optimization);
          setProgress({ current: operations.length, total: operations.length, operation: 'Completed' });
          progressCallback?.(operations.length, operations.length, 'Batch operation completed');

          return response.data;
        } catch (error: any) {
          recordMetrics(null, true);
          throw error;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        showToast({
          type: data.failed === 0 ? 'success' : 'warning',
          title: 'バッチ処理完了',
          message: `${data.totalOperations}件中${data.successful}件が正常に処理されました`
        });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          title: 'バッチ処理失敗',
          message: error.message
        });
      }
    });

    return {
      executeBatch: batchMutation.mutate,
      isProcessing: batchMutation.isPending,
      result: batchMutation.data,
      progress
    };
  }, [token, showToast, queryClient, recordMetrics]);

  // Clear optimistic updates (for error recovery)
  const clearOptimisticUpdates = useCallback(() => {
    optimisticManager.clear();
    showToast({
      type: 'info',
      title: '状態をリセット',
      message: '未確定の変更をクリアしました'
    });
  }, [showToast]);

  return {
    useOptimisticPosts,
    useDashboardData,
    useBatchOperations,
    performanceMetrics,
    clearOptimisticUpdates,
    isRealTimeConnected: wsConnected
  };
}

// Export individual hooks for convenience
export const {
  useOptimisticPosts,
  useDashboardData,
  useBatchOperations
} = {} as ReturnType<typeof useIntegratedApi>;