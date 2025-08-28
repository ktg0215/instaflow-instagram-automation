'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// API response types
interface OptimizedApiOptions {
  fields?: string[];
  include?: string[];
  compress?: boolean;
  cache?: boolean;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  metadata?: any;
  optimization?: {
    compressed: boolean;
    compressionRatio?: string;
    cached: boolean;
    responseTime: number;
  };
}

interface BatchOperation {
  operation: 'create' | 'update' | 'delete' | 'publish' | 'schedule';
  data: any;
  id?: string;
}

// Enhanced fetch with optimization options
async function optimizedFetch<T>(
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

  const url = `${endpoint}${params.toString() ? `?${params}` : ''}`;
  const startTime = Date.now();

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...fetchOptions.headers
    },
    signal: optimize.timeout ? AbortSignal.timeout(optimize.timeout) : undefined
  });

  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
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
      responseTime
    }
  };
}

// Hook for optimized posts API
export function useOptimizedPosts(options: OptimizedApiOptions = {}) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const defaultOptions = useMemo(() => ({
    fields: ['id', 'caption', 'status', 'created_at', 'scheduled_at'],
    include: ['engagement'],
    compress: true,
    ...options
  }), [options]);

  // Fetch posts with optimization
  const {
    data: posts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['posts', 'optimized', defaultOptions],
    queryFn: async () => {
      const response = await optimizedFetch<any>('/api/v2/posts', {
        headers: { Authorization: `Bearer ${token}` },
        optimize: defaultOptions
      });
      return response;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await optimizedFetch<any>('/api/v2/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ posts: [postData] }),
        optimize: { compress: true }
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      showToast({
        type: 'success',
        title: '投稿作成完了',
        message: '投稿が正常に作成されました'
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: '投稿作成失敗',
        message: error.message
      });
    }
  });

  return {
    posts: posts?.data?.posts || [],
    isLoading,
    error,
    refetch,
    createPost: createPostMutation.mutate,
    isCreating: createPostMutation.isPending,
    optimization: posts?.optimization
  };
}

// Hook for dashboard data
export function useDashboardData(refresh = false) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'optimized'],
    queryFn: async () => {
      const response = await optimizedFetch<any>('/api/v2/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        optimize: { compress: true, cache: !refresh }
      });
      return response.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for calendar data
export function useCalendarData(year?: number, month?: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['calendar', year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set('year', year.toString());
      if (month) params.set('month', month.toString());

      const response = await optimizedFetch<any>(
        `/api/v2/calendar?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          optimize: { compress: true }
        }
      );
      return response.data;
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for batch operations
export function useBatchOperations() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const batchMutation = useMutation({
    mutationFn: async ({ 
      operations, 
      transactional = false 
    }: { 
      operations: BatchOperation[], 
      transactional?: boolean 
    }) => {
      const response = await optimizedFetch<any>('/api/v2/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ operations, transactional, notify: true }),
        optimize: { timeout: 60000 } // 1 minute timeout for batch operations
      });
      return response.data;
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
    onError: (error: Error) => {
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
    result: batchMutation.data
  };
}

// Hook for image optimization
export function useImageOptimization() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeImage = useCallback(async (
    file: File,
    options: {
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      size?: 'square' | 'portrait' | 'landscape' | 'story' | 'thumbnail' | 'preview';
      quality?: number;
      watermark?: boolean;
    } = {}
  ) => {
    if (!token) {
      throw new Error('認証が必要です');
    }

    setIsOptimizing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const startTime = Date.now();
      
      const response = await fetch('/api/v2/media/optimize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '画像の最適化に失敗しました');
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      showToast({
        type: 'success',
        title: '画像最適化完了',
        message: `${result.optimization.compressionRatio} 圧縮されました（${processingTime}ms）`
      });

      return result;

    } catch (error: any) {
      showToast({
        type: 'error',
        title: '画像最適化失敗',
        message: error.message
      });
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }, [token, showToast]);

  return {
    optimizeImage,
    isOptimizing
  };
}

// Hook for preview generation
export function usePreview() {
  const { token } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePreview = useCallback(async (data: {
    caption: string;
    mediaUrl?: string;
    hashtags?: string[];
    includeOptimization?: boolean;
    includeScheduling?: boolean;
  }) => {
    if (!token) {
      throw new Error('認証が必要です');
    }

    setIsGenerating(true);

    try {
      const response = await optimizedFetch<any>('/api/v2/preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
        optimize: { compress: true }
      });

      return response.data.preview;

    } catch (error) {
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [token]);

  return {
    generatePreview,
    isGenerating
  };
}

// Hook for app metadata
export function useAppMetadata(type?: 'plans' | 'features' | 'limits' | 'app') {
  return useQuery({
    queryKey: ['metadata', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      const response = await optimizedFetch<any>(`/api/v2/metadata${params}`, {
        optimize: { compress: true, cache: true }
      });
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Performance monitoring hook
export function useApiPerformance() {
  const [metrics, setMetrics] = useState({
    averageResponseTime: 0,
    cacheHitRate: 0,
    compressionSavings: 0,
    totalRequests: 0
  });

  const recordMetrics = useCallback((optimization: any) => {
    if (!optimization) return;

    setMetrics(prev => {
      const newTotal = prev.totalRequests + 1;
      const newAverage = (prev.averageResponseTime * prev.totalRequests + optimization.responseTime) / newTotal;
      const hitCount = optimization.cached ? 1 : 0;
      const newCacheHitRate = (prev.cacheHitRate * prev.totalRequests + hitCount) / newTotal;

      return {
        averageResponseTime: Math.round(newAverage),
        cacheHitRate: Math.round(newCacheHitRate * 100),
        compressionSavings: optimization.compressionRatio ? 
          parseInt(optimization.compressionRatio.replace('%', '')) : 0,
        totalRequests: newTotal
      };
    });
  }, []);

  return {
    metrics,
    recordMetrics
  };
}