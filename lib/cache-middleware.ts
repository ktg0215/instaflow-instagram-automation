import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

// Types
interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
  statusCode: number;
  headers: Record<string, string>;
}

interface CacheConfig {
  maxAge: number; // in milliseconds
  staleWhileRevalidate?: boolean;
  tags?: string[];
  vary?: string[]; // Headers to vary cache by (e.g., ['user-agent', 'accept-encoding'])
}

// In-memory cache (in production, you'd use Redis or similar)
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000;
  
  set(key: string, value: CacheEntry): void {
    // Simple LRU: remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    return entry;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      // In a real implementation, you'd store tags with entries
      if (key.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }
  
  size(): number {
    return this.cache.size;
  }
}

const cache = new MemoryCache();

// Utility functions
function generateCacheKey(request: NextRequest, config: CacheConfig): string {
  const url = new URL(request.url);
  const baseKey = `${request.method}:${url.pathname}${url.search}`;
  
  // Add vary headers to cache key
  if (config.vary) {
    const varyValues = config.vary
      .map(header => `${header}:${request.headers.get(header) || ''}`)
      .join('|');
    return `${baseKey}|${varyValues}`;
  }
  
  return baseKey;
}

function generateETag(data: any): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return Buffer.from(content).toString('base64').substring(0, 16);
}

function isStale(entry: CacheEntry, maxAge: number): boolean {
  return Date.now() - entry.timestamp > maxAge;
}

function shouldCache(request: NextRequest): boolean {
  // Only cache GET requests
  if (request.method !== 'GET') return false;
  
  // Don't cache if no-cache header is present
  const cacheControl = request.headers.get('cache-control');
  if (cacheControl?.includes('no-cache')) return false;
  
  return true;
}

// Main cache middleware
export function withCache(config: CacheConfig) {
  return function cacheMiddleware<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async function cachedHandler(request: NextRequest, ...args: T): Promise<NextResponse> {
      // Skip caching for non-cacheable requests
      if (!shouldCache(request)) {
        return handler(request, ...args);
      }
      
      const cacheKey = generateCacheKey(request, config);
      const cached = cache.get(cacheKey);
      
      // Handle conditional requests (304 Not Modified)
      if (cached) {
        const ifNoneMatch = request.headers.get('if-none-match');
        if (ifNoneMatch === cached.etag) {
          return new NextResponse(null, { 
            status: 304,
            headers: {
              'ETag': cached.etag,
              'Cache-Control': `max-age=${Math.floor(config.maxAge / 1000)}`,
            }
          });
        }
        
        // Return cached response if not stale
        if (!isStale(cached, config.maxAge)) {
          return NextResponse.json(cached.data, {
            status: cached.statusCode,
            headers: {
              ...cached.headers,
              'ETag': cached.etag,
              'Cache-Control': `max-age=${Math.floor(config.maxAge / 1000)}`,
              'X-Cache': 'HIT',
            }
          });
        }
        
        // Handle stale-while-revalidate
        if (config.staleWhileRevalidate && isStale(cached, config.maxAge)) {
          // Return stale content immediately
          const staleResponse = NextResponse.json(cached.data, {
            status: cached.statusCode,
            headers: {
              ...cached.headers,
              'ETag': cached.etag,
              'Cache-Control': `max-age=0, stale-while-revalidate=${Math.floor(config.maxAge / 1000)}`,
              'X-Cache': 'STALE',
            }
          });
          
          // Revalidate in background (non-blocking)
          setImmediate(async () => {
            try {
              const freshResponse = await handler(request, ...args);
              if (freshResponse.ok) {
                const freshData = await freshResponse.json();
                const freshEtag = generateETag(freshData);
                
                cache.set(cacheKey, {
                  data: freshData,
                  timestamp: Date.now(),
                  etag: freshEtag,
                  statusCode: freshResponse.status,
                  headers: Object.fromEntries(freshResponse.headers.entries())
                });
              }
            } catch (error) {
              console.error('Background revalidation failed:', error);
            }
          });
          
          return staleResponse;
        }
      }
      
      // No cache hit, execute handler
      try {
        const response = await handler(request, ...args);
        
        // Only cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          const data = await responseClone.json();
          const etag = generateETag(data);
          
          // Store in cache
          cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            etag,
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          // Add cache headers to response
          response.headers.set('ETag', etag);
          response.headers.set('Cache-Control', `max-age=${Math.floor(config.maxAge / 1000)}`);
          response.headers.set('X-Cache', 'MISS');
        }
        
        return response;
      } catch (error) {
        // Return cached data as fallback if available
        if (cached && config.staleWhileRevalidate) {
          console.warn('Handler failed, returning stale cache:', error);
          return NextResponse.json(cached.data, {
            status: cached.statusCode,
            headers: {
              ...cached.headers,
              'ETag': cached.etag,
              'Cache-Control': 'max-age=0',
              'X-Cache': 'STALE-ERROR',
            }
          });
        }
        
        throw error;
      }
    };
  };
}

// Cache management utilities
export const cacheUtils = {
  // Clear all cache
  clear: () => cache.clear(),
  
  // Get cache stats
  stats: () => ({
    size: cache.size(),
    maxSize: 1000
  }),
  
  // Invalidate cache by pattern
  invalidate: (pattern: string) => {
    cache.invalidateByTag(pattern);
  },
  
  // Warm cache by pre-populating
  warm: async (key: string, data: any, config: CacheConfig) => {
    const etag = generateETag(data);
    cache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
      statusCode: 200,
      headers: {}
    });
  }
};

// Predefined cache configurations
export const cacheConfigs = {
  // Short cache for frequently changing data
  short: {
    maxAge: 2 * 60 * 1000, // 2 minutes
    staleWhileRevalidate: true
  } as CacheConfig,
  
  // Medium cache for semi-static data
  medium: {
    maxAge: 15 * 60 * 1000, // 15 minutes
    staleWhileRevalidate: true
  } as CacheConfig,
  
  // Long cache for static data
  long: {
    maxAge: 60 * 60 * 1000, // 1 hour
    staleWhileRevalidate: true
  } as CacheConfig,
  
  // User-specific cache
  userSpecific: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    vary: ['authorization'],
    staleWhileRevalidate: true
  } as CacheConfig
};

export default withCache;