// SECURITY: Rate limiting implementation for API endpoints
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  // SECURITY: Different limits for different endpoint types
  private getLimits(endpoint: string): { requests: number; windowMs: number } {
    if (endpoint.includes('/auth/')) {
      return { requests: 5, windowMs: 60000 }; // 5 requests per minute for auth
    }
    if (endpoint.includes('/api/posts')) {
      return { requests: 30, windowMs: 60000 }; // 30 requests per minute for posts
    }
    if (endpoint.includes('/api/instagram/')) {
      return { requests: 10, windowMs: 60000 }; // 10 requests per minute for Instagram API
    }
    if (endpoint.includes('/api/ai/')) {
      return { requests: 20, windowMs: 60000 }; // 20 requests per minute for AI
    }
    return { requests: 100, windowMs: 60000 }; // Default: 100 requests per minute
  }

  // SECURITY: Generate identifier from IP and user ID
  private getIdentifier(ip: string, userId?: string): string {
    const sanitizedIp = ip.replace(/[^0-9a-f:.]/gi, ''); // Sanitize IP
    return userId ? `${sanitizedIp}-${userId}` : sanitizedIp;
  }

  // Check if request is allowed
  checkLimit(ip: string, endpoint: string, userId?: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const identifier = this.getIdentifier(ip, userId);
    const key = `${identifier}-${endpoint}`;
    const limits = this.getLimits(endpoint);
    const now = Date.now();

    const entry = this.requests.get(key);

    // First request or window expired
    if (!entry || now >= entry.resetTime) {
      const resetTime = now + limits.windowMs;
      this.requests.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limits.requests - 1,
        resetTime
      };
    }

    // Within window - check if limit exceeded
    if (entry.count >= limits.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: limits.requests - entry.count,
      resetTime: entry.resetTime
    };
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now >= entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  // Destroy cleanup interval
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }
  
  return '127.0.0.1'; // fallback for development
}

// Middleware function for rate limiting
export async function applyRateLimit(
  request: Request,
  endpoint: string,
  userId?: string
): Promise<{ success: boolean; error?: string; headers: Record<string, string> }> {
  const ip = getClientIP(request);
  const result = rateLimiter.checkLimit(ip, endpoint, userId);

  const headers = {
    'X-RateLimit-Limit': rateLimiter.getLimits(endpoint).requests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  if (!result.allowed) {
    return {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      headers
    };
  }

  return { success: true, headers };
}

export default rateLimiter;