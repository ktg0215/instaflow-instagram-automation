// ==========================================
// PERFORMANCE OPTIMIZATION SYSTEM
// Advanced caching, query optimization, and performance monitoring
// ==========================================

import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// ==========================================
// TYPES AND INTERFACES
// ==========================================

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: number; // SWR time in milliseconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Enable compression for large data
  serialize?: boolean; // Enable JSON serialization
}

export interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  dataSize: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface QueryOptimization {
  useIndex?: string[];
  batchSize?: number;
  prefetch?: string[];
  parallel?: boolean;
}

// ==========================================
// REDIS-COMPATIBLE MEMORY CACHE
// High-performance in-memory caching with LRU eviction
// ==========================================

class MemoryCache {
  private cache = new Map<string, {
    value: any;
    expiry: number;
    size: number;
    tags: string[];
    compressed?: boolean;
  }>();
  
  private maxSize: number;
  private currentSize = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(maxSizeMB = 100) {
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry || Date.now() > entry.expiry) {
      this.missCount++;
      if (entry) this.delete(key);
      return null;
    }

    this.hitCount++;
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.compressed 
      ? JSON.parse(this.decompress(entry.value))
      : entry.value;
  }

  async set(
    key: string, 
    value: any, 
    config: CacheConfig
  ): Promise<void> {
    // Serialize and optionally compress
    let processedValue = value;
    let size = JSON.stringify(value).length;
    let compressed = false;

    if (config.compress && size > 1024) { // Compress if > 1KB
      processedValue = this.compress(JSON.stringify(value));
      compressed = true;
      size = processedValue.length;
    }

    const expiry = Date.now() + config.ttl;
    
    // Evict entries if needed
    await this.ensureCapacity(size);

    this.cache.set(key, {
      value: processedValue,
      expiry,
      size,
      tags: config.tags || [],
      compressed
    });
    
    this.currentSize += size;
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        await this.delete(key);
      }
    }
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      hitRate: total > 0 ? this.hitCount / total : 0,
      entries: this.cache.size,
      memoryUsage: this.currentSize,
      maxMemory: this.maxSize
    };
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Remove expired entries first
    this.cleanup();

    // LRU eviction if still need space
    while (this.currentSize + newEntrySize > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) await this.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
      }
    }
  }

  private compress(data: string): string {
    // Simple compression simulation (in production, use zlib or similar)
    return Buffer.from(data, 'utf8').toString('base64');
  }

  private decompress(data: string): string {
    return Buffer.from(data, 'base64').toString('utf8');
  }
}

// ==========================================
// QUERY OPTIMIZER
// Intelligent query batching and optimization
// ==========================================

export class QueryOptimizer {
  private batchQueue = new Map<string, {
    queries: Array<{ query: string; params: any[]; resolve: any; reject: any }>;
    timeout: NodeJS.Timeout;
  }>();
  
  private queryStats = new Map<string, {
    count: number;
    avgTime: number;
    slowQueries: number;
  }>();

  // Batch multiple queries into single database call
  async batchQueries(
    database: any,
    queries: Array<{ query: string; params: any[] }>,
    batchKey?: string
  ): Promise<any[]> {
    const key = batchKey || 'default';
    const batch = this.batchQueue.get(key);
    
    return new Promise((resolve, reject) => {
      const newQuery = { query: queries[0].query, params: queries[0].params, resolve, reject };
      
      if (batch) {
        batch.queries.push(newQuery);
      } else {
        this.batchQueue.set(key, {
          queries: [newQuery],
          timeout: setTimeout(() => this.executeBatch(database, key), 10) // 10ms batching window
        });
      }
    });
  }

  private async executeBatch(database: any, batchKey: string): Promise<void> {
    const batch = this.batchQueue.get(batchKey);
    if (!batch) return;

    this.batchQueue.delete(batchKey);
    clearTimeout(batch.timeout);

    try {
      // Execute queries in parallel
      const results = await Promise.all(
        batch.queries.map(({ query, params }) => 
          database.query(query, params)
        )
      );

      batch.queries.forEach((queryInfo, index) => {
        queryInfo.resolve(results[index]);
      });
    } catch (error) {
      batch.queries.forEach(queryInfo => {
        queryInfo.reject(error);
      });
    }
  }

  // Track query performance
  recordQuery(queryType: string, executionTime: number): void {
    const stats = this.queryStats.get(queryType) || { count: 0, avgTime: 0, slowQueries: 0 };
    
    stats.count++;
    stats.avgTime = (stats.avgTime * (stats.count - 1) + executionTime) / stats.count;
    
    if (executionTime > 1000) { // Slow query threshold: 1 second
      stats.slowQueries++;
    }
    
    this.queryStats.set(queryType, stats);
  }

  getQueryStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [queryType, queryStats] of this.queryStats.entries()) {
      stats[queryType] = queryStats;
    }
    return stats;
  }

  // Generate optimized query suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    for (const [queryType, stats] of this.queryStats.entries()) {
      if (stats.avgTime > 500) {
        suggestions.push(`Consider optimizing ${queryType} - average execution time: ${stats.avgTime}ms`);
      }
      
      if (stats.slowQueries / stats.count > 0.1) {
        suggestions.push(`${queryType} has ${((stats.slowQueries / stats.count) * 100).toFixed(1)}% slow queries`);
      }
    }
    
    return suggestions;
  }
}

// ==========================================
// PERFORMANCE MONITORING
// Real-time performance metrics and alerts
// ==========================================

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics[]>();
  private alerts: Array<{ type: string; message: string; timestamp: number }> = [];
  private thresholds = {
    queryTime: 1000, // 1 second
    cacheHitRate: 0.8, // 80%
    memoryUsage: 0.9 // 90%
  };

  recordMetric(key: string, metrics: PerformanceMetrics): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metricsList = this.metrics.get(key)!;
    metricsList.push(metrics);
    
    // Keep only last 1000 metrics per key
    if (metricsList.length > 1000) {
      metricsList.splice(0, metricsList.length - 1000);
    }
    
    // Check for alerts
    this.checkAlerts(key, metrics);
  }

  private checkAlerts(key: string, metrics: PerformanceMetrics): void {
    if (metrics.queryTime > this.thresholds.queryTime) {
      this.alerts.push({
        type: 'SLOW_QUERY',
        message: `Slow query detected for ${key}: ${metrics.queryTime}ms`,
        timestamp: Date.now()
      });
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > this.thresholds.memoryUsage) {
      this.alerts.push({
        type: 'HIGH_MEMORY',
        message: `High memory usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    }
  }

  getMetrics(key?: string, timeWindow?: number): Record<string, any> {
    const now = Date.now();
    const cutoff = timeWindow ? now - timeWindow : 0;
    
    const result: Record<string, any> = {};
    
    for (const [metricKey, metricsList] of this.metrics.entries()) {
      if (key && key !== metricKey) continue;
      
      const filteredMetrics = metricsList.filter(m => m.timestamp >= cutoff);
      
      if (filteredMetrics.length === 0) continue;
      
      const avgQueryTime = filteredMetrics.reduce((sum, m) => sum + m.queryTime, 0) / filteredMetrics.length;
      const cacheHitRate = filteredMetrics.filter(m => m.cacheHit).length / filteredMetrics.length;
      const avgDataSize = filteredMetrics.reduce((sum, m) => sum + m.dataSize, 0) / filteredMetrics.length;
      
      result[metricKey] = {
        count: filteredMetrics.length,
        avgQueryTime,
        cacheHitRate,
        avgDataSize,
        slowQueries: filteredMetrics.filter(m => m.queryTime > this.thresholds.queryTime).length
      };
    }
    
    return result;
  }

  getAlerts(severity?: string): Array<any> {
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 3600000); // Last hour
    
    if (severity) {
      return recentAlerts.filter(a => a.type === severity);
    }
    
    return recentAlerts;
  }
}

// ==========================================
// CACHE MANAGER
// Unified caching with multiple backends
// ==========================================

export class CacheManager {
  private memoryCache: MemoryCache;
  private queryOptimizer: QueryOptimizer;
  private performanceMonitor: PerformanceMonitor;

  constructor(options: { maxMemoryMB?: number } = {}) {
    this.memoryCache = new MemoryCache(options.maxMemoryMB || 100);
    this.queryOptimizer = new QueryOptimizer();
    this.performanceMonitor = new PerformanceMonitor();
  }

  // Get data with caching
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = { ttl: 300000 } // 5 minutes default
  ): Promise<T> {
    const startTime = Date.now();
    
    // Try cache first
    const cached = await this.memoryCache.get<T>(key);
    if (cached !== null) {
      this.performanceMonitor.recordMetric(key, {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        dataSize: JSON.stringify(cached).length,
        timestamp: Date.now()
      });
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetcher();
    const queryTime = Date.now() - startTime;
    
    // Store in cache
    await this.memoryCache.set(key, data, config);
    
    this.performanceMonitor.recordMetric(key, {
      queryTime,
      cacheHit: false,
      dataSize: JSON.stringify(data).length,
      timestamp: Date.now()
    });

    return data;
  }

  // Optimized database query with caching
  async query<T>(
    database: any,
    queryKey: string,
    query: string,
    params: any[] = [],
    config: CacheConfig & QueryOptimization = { ttl: 300000 }
  ): Promise<T> {
    const cacheKey = `query:${queryKey}:${Buffer.from(JSON.stringify({ query, params })).toString('base64')}`;
    
    return this.get<T>(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        let result;
        if (config.parallel && Array.isArray(query)) {
          // Parallel queries
          result = await Promise.all(
            query.map((q, i) => database.query(q, params[i] || []))
          );
        } else if (config.batchSize) {
          // Batched query
          result = await this.queryOptimizer.batchQueries(
            database,
            [{ query, params }],
            queryKey
          );
        } else {
          // Single query
          result = await database.query(query, params);
        }
        
        const queryTime = Date.now() - startTime;
        this.queryOptimizer.recordQuery(queryKey, queryTime);
        
        return result;
      },
      config
    );
  }

  // Invalidate cache by tags or keys
  async invalidate(tags?: string[], keys?: string[]): Promise<void> {
    if (tags) {
      await this.memoryCache.invalidateByTags(tags);
    }
    
    if (keys) {
      await Promise.all(keys.map(key => this.memoryCache.delete(key)));
    }
  }

  // Get performance statistics
  getStats(): any {
    return {
      cache: this.memoryCache.getStats(),
      queries: this.queryOptimizer.getQueryStats(),
      performance: this.performanceMonitor.getMetrics(),
      alerts: this.performanceMonitor.getAlerts(),
      optimizationSuggestions: this.queryOptimizer.getOptimizationSuggestions()
    };
  }
}

// ==========================================
// HTTP CACHE UTILITIES
// Response caching with proper headers
// ==========================================

export class HttpCacheManager {
  // Generate ETag for response
  static generateETag(data: any): string {
    const hash = Buffer.from(JSON.stringify(data))
      .toString('base64')
      .substring(0, 16);
    return `"${hash}"`;
  }

  // Check if response should be cached
  static shouldCache(request: NextRequest): boolean {
    const method = request.method;
    const url = new URL(request.url);
    
    // Only cache GET requests
    if (method !== 'GET') return false;
    
    // Don't cache authenticated endpoints
    if (request.headers.get('authorization')) return false;
    
    // Don't cache real-time data endpoints
    const noCachePatterns = ['/api/auth/', '/api/webhook/', '/api/health/'];
    return !noCachePatterns.some(pattern => url.pathname.includes(pattern));
  }

  // Get cache control headers
  static getCacheHeaders(config: {
    maxAge?: number;
    staleWhileRevalidate?: number;
    private?: boolean;
    noCache?: boolean;
  }): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (config.noCache) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
      return headers;
    }
    
    const cacheControl = [];
    
    if (config.private) {
      cacheControl.push('private');
    } else {
      cacheControl.push('public');
    }
    
    if (config.maxAge) {
      cacheControl.push(`max-age=${config.maxAge}`);
    }
    
    if (config.staleWhileRevalidate) {
      cacheControl.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
    }
    
    headers['Cache-Control'] = cacheControl.join(', ');
    
    return headers;
  }
}

// ==========================================
// CONNECTION POOL OPTIMIZER
// Database connection optimization
// ==========================================

export class ConnectionPoolOptimizer {
  private static instance: ConnectionPoolOptimizer;
  private connectionMetrics = new Map<string, {
    activeConnections: number;
    queuedQueries: number;
    avgResponseTime: number;
    errors: number;
  }>();

  static getInstance(): ConnectionPoolOptimizer {
    if (!ConnectionPoolOptimizer.instance) {
      ConnectionPoolOptimizer.instance = new ConnectionPoolOptimizer();
    }
    return ConnectionPoolOptimizer.instance;
  }

  // Get optimal pool configuration based on load
  getOptimalPoolConfig(currentLoad: {
    qps: number; // queries per second
    avgQueryTime: number;
    peakConcurrency: number;
  }): {
    min: number;
    max: number;
    idleTimeoutMs: number;
    acquireTimeoutMs: number;
  } {
    const baseConfig = {
      min: 2,
      max: 10,
      idleTimeoutMs: 60000,
      acquireTimeoutMs: 8000
    };

    // Adjust based on query rate
    if (currentLoad.qps > 100) {
      baseConfig.max = Math.min(30, Math.ceil(currentLoad.qps / 10));
      baseConfig.min = Math.max(5, Math.ceil(baseConfig.max * 0.2));
    }

    // Adjust based on query complexity
    if (currentLoad.avgQueryTime > 1000) {
      baseConfig.max *= 1.5;
      baseConfig.acquireTimeoutMs = 15000;
    }

    // Adjust based on peak concurrency
    if (currentLoad.peakConcurrency > baseConfig.max) {
      baseConfig.max = Math.min(50, currentLoad.peakConcurrency * 1.2);
    }

    return baseConfig;
  }

  recordConnectionMetric(poolName: string, metrics: {
    activeConnections: number;
    queuedQueries: number;
    responseTime: number;
    error?: boolean;
  }): void {
    const current = this.connectionMetrics.get(poolName) || {
      activeConnections: 0,
      queuedQueries: 0,
      avgResponseTime: 0,
      errors: 0
    };

    current.activeConnections = metrics.activeConnections;
    current.queuedQueries = metrics.queuedQueries;
    current.avgResponseTime = (current.avgResponseTime * 0.9) + (metrics.responseTime * 0.1);
    
    if (metrics.error) {
      current.errors++;
    }

    this.connectionMetrics.set(poolName, current);
  }

  getConnectionHealth(): Record<string, any> {
    const health: Record<string, any> = {};
    
    for (const [poolName, metrics] of this.connectionMetrics.entries()) {
      health[poolName] = {
        status: this.getPoolStatus(metrics),
        ...metrics,
        utilization: metrics.activeConnections / (metrics.activeConnections + metrics.queuedQueries + 1),
        errorRate: metrics.errors / (metrics.errors + 100) // Simplified error rate
      };
    }
    
    return health;
  }

  private getPoolStatus(metrics: any): 'healthy' | 'warning' | 'critical' {
    if (metrics.avgResponseTime > 5000 || metrics.errors > 10) {
      return 'critical';
    }
    if (metrics.avgResponseTime > 2000 || metrics.queuedQueries > 10) {
      return 'warning';
    }
    return 'healthy';
  }
}

// ==========================================
// GLOBAL INSTANCES
// ==========================================

// Global cache manager instance
export const globalCache = new CacheManager({
  maxMemoryMB: parseInt(process.env.CACHE_SIZE_MB || '100')
});

// Global connection pool optimizer
export const connectionOptimizer = ConnectionPoolOptimizer.getInstance();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Create cache key with namespace
export function createCacheKey(namespace: string, ...parts: (string | number)[]): string {
  return `${namespace}:${parts.join(':')}`;
}

// Cache configuration presets
export const CachePresets = {
  // Fast-changing data (user sessions, real-time data)
  SHORT: { ttl: 60000, tags: ['short-lived'] }, // 1 minute
  
  // Medium-changing data (user posts, preferences)
  MEDIUM: { ttl: 300000, tags: ['medium-lived'] }, // 5 minutes
  
  // Slow-changing data (user profiles, settings)
  LONG: { ttl: 3600000, tags: ['long-lived'] }, // 1 hour
  
  // Static data (subscription plans, system config)
  STATIC: { ttl: 86400000, tags: ['static'] }, // 24 hours
  
  // Large data with compression
  LARGE: { ttl: 1800000, compress: true, tags: ['large-data'] }, // 30 minutes
  
  // User-specific data
  USER: (userId: string) => ({ 
    ttl: 900000, // 15 minutes
    tags: [`user:${userId}`, 'user-data'] 
  }),
  
  // Query result caching
  QUERY: (table: string) => ({
    ttl: 600000, // 10 minutes
    tags: [`query:${table}`, 'database']
  })
};

export default CacheManager;