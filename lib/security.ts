// ==========================================
// ADVANCED SECURITY SYSTEM
// Comprehensive security utilities for production deployment
// ==========================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { InputValidator, ValidationResult } from './input-validator';

// ==========================================
// TYPES AND INTERFACES
// ==========================================

export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
  tokenSecurity: {
    secretRotation: boolean;
    jwtExpiry: string;
    refreshTokenExpiry: string;
  };
  auditLogging: {
    enabled: boolean;
    sensitiveFields: string[];
  };
}

export interface SecurityEvent {
  id: string;
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
  timestamp: Date;
}

// ==========================================
// ENCRYPTION UTILITIES
// ==========================================

export class EncryptionManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16;

  // Generate secure random key
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('base64');
  }

  // Encrypt sensitive data
  static encrypt(data: string, key?: string): {
    encrypted: string;
    iv: string;
    tag: string;
    salt?: string;
  } {
    try {
      let encryptionKey: Buffer;
      let salt: Buffer | undefined;

      if (key) {
        encryptionKey = Buffer.from(key, 'base64');
      } else {
        // Generate key from environment secret
        salt = crypto.randomBytes(this.SALT_LENGTH);
        encryptionKey = crypto.pbkdf2Sync(
          process.env.ENCRYPTION_SECRET || 'fallback-secret',
          salt,
          100000,
          this.KEY_LENGTH,
          'sha512'
        );
      }

      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, encryptionKey);
      cipher.setAAD(Buffer.from('instagram-automation', 'utf8'));

      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        salt: salt?.toString('base64')
      };
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
    salt?: string;
  }, key?: string): string {
    try {
      let decryptionKey: Buffer;

      if (key) {
        decryptionKey = Buffer.from(key, 'base64');
      } else if (encryptedData.salt) {
        decryptionKey = crypto.pbkdf2Sync(
          process.env.ENCRYPTION_SECRET || 'fallback-secret',
          Buffer.from(encryptedData.salt, 'base64'),
          100000,
          this.KEY_LENGTH,
          'sha512'
        );
      } else {
        throw new Error('No decryption key available');
      }

      const decipher = crypto.createDecipher(this.ALGORITHM, decryptionKey);
      decipher.setAAD(Buffer.from('instagram-automation', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  // Hash passwords securely
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // Increased from default 10 for better security
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  // Generate secure random token
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  // Create HMAC signature
  static createSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // Verify HMAC signature
  static verifySignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

// ==========================================
// ADVANCED RATE LIMITING
// ==========================================

export class AdvancedRateLimiter {
  private attempts = new Map<string, Array<{ timestamp: number; weight: number }>>();
  private bannedIps = new Map<string, { until: number; reason: string }>();
  private suspiciousActivities = new Map<string, number>();

  // Check if request should be allowed with advanced logic
  checkAdvancedLimit(
    identifier: string,
    endpoint: string,
    request: NextRequest
  ): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    riskScore: number;
  } {
    const now = Date.now();
    const riskScore = this.calculateRiskScore(identifier, request);
    
    // Check if IP is banned
    const banned = this.bannedIps.get(identifier);
    if (banned && now < banned.until) {
      return {
        allowed: false,
        reason: `Banned: ${banned.reason}`,
        retryAfter: banned.until - now,
        riskScore
      };
    }

    // Clean expired bans
    if (banned && now >= banned.until) {
      this.bannedIps.delete(identifier);
    }

    // Get rate limit configuration based on endpoint and risk
    const config = this.getRateLimitConfig(endpoint, riskScore);
    const attempts = this.getRecentAttempts(identifier, config.windowMs);
    
    // Calculate weighted request count
    const weightedCount = attempts.reduce((sum, attempt) => sum + attempt.weight, 0);
    
    // Check if limit exceeded
    if (weightedCount >= config.maxRequests) {
      // Escalate punishment for repeated violations
      this.escalatePunishment(identifier);
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: config.windowMs,
        riskScore
      };
    }

    // Record this attempt
    this.recordAttempt(identifier, now, this.getRequestWeight(request));
    
    return {
      allowed: true,
      riskScore
    };
  }

  private calculateRiskScore(identifier: string, request: NextRequest): number {
    let score = 0;

    // Base score from IP reputation (simplified)
    score += this.getIpRiskScore(identifier);
    
    // User agent analysis
    const userAgent = request.headers.get('user-agent') || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      score += 30;
    }
    
    // Request pattern analysis
    const recentAttempts = this.getRecentAttempts(identifier, 60000); // Last minute
    if (recentAttempts.length > 10) {
      score += 20;
    }
    
    // Suspicious activity history
    const suspiciousCount = this.suspiciousActivities.get(identifier) || 0;
    score += Math.min(suspiciousCount * 5, 50);

    return Math.min(score, 100);
  }

  private getRateLimitConfig(endpoint: string, riskScore: number): {
    maxRequests: number;
    windowMs: number;
  } {
    let baseConfig = { maxRequests: 100, windowMs: 60000 };
    
    // Endpoint-specific limits
    if (endpoint.includes('/auth/')) {
      baseConfig = { maxRequests: 5, windowMs: 60000 };
    } else if (endpoint.includes('/api/posts')) {
      baseConfig = { maxRequests: 30, windowMs: 60000 };
    } else if (endpoint.includes('/api/instagram/')) {
      baseConfig = { maxRequests: 10, windowMs: 60000 };
    }
    
    // Adjust based on risk score
    const riskMultiplier = 1 - (riskScore / 200); // Reduce limits for high-risk requests
    
    return {
      maxRequests: Math.max(1, Math.floor(baseConfig.maxRequests * riskMultiplier)),
      windowMs: baseConfig.windowMs
    };
  }

  private getRequestWeight(request: NextRequest): number {
    let weight = 1;
    
    // Higher weight for expensive operations
    if (request.method === 'POST' || request.method === 'PUT') {
      weight += 1;
    }
    
    // Higher weight for AI endpoints
    if (request.url.includes('/api/ai/')) {
      weight += 3;
    }
    
    // Higher weight for Instagram API calls
    if (request.url.includes('/api/instagram/publish')) {
      weight += 5;
    }
    
    return weight;
  }

  private getRecentAttempts(identifier: string, windowMs: number): Array<{ timestamp: number; weight: number }> {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Filter recent attempts
    const recentAttempts = attempts.filter(attempt => now - attempt.timestamp < windowMs);
    
    // Update the map with filtered attempts
    if (recentAttempts.length !== attempts.length) {
      this.attempts.set(identifier, recentAttempts);
    }
    
    return recentAttempts;
  }

  private recordAttempt(identifier: string, timestamp: number, weight: number): void {
    const attempts = this.attempts.get(identifier) || [];
    attempts.push({ timestamp, weight });
    this.attempts.set(identifier, attempts);
  }

  private escalatePunishment(identifier: string): void {
    const violations = this.suspiciousActivities.get(identifier) || 0;
    const newViolations = violations + 1;
    
    this.suspiciousActivities.set(identifier, newViolations);
    
    // Progressive punishment
    if (newViolations >= 5) {
      // Ban for 1 hour
      this.bannedIps.set(identifier, {
        until: Date.now() + 3600000,
        reason: 'Repeated rate limit violations'
      });
    } else if (newViolations >= 10) {
      // Ban for 24 hours
      this.bannedIps.set(identifier, {
        until: Date.now() + 86400000,
        reason: 'Excessive rate limit violations'
      });
    }
  }

  private getIpRiskScore(ip: string): number {
    // Simplified IP reputation scoring
    // In production, integrate with threat intelligence services
    
    // Private/local IPs get lower risk
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1') {
      return 0;
    }
    
    // Known bot/crawler user agents get higher risk
    return 10; // Base risk for unknown public IPs
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /python/i,
      /requests/i,
      /^$/
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  // Get current statistics
  getStatistics(): {
    activeRequests: number;
    bannedIps: number;
    suspiciousActivities: number;
  } {
    return {
      activeRequests: this.attempts.size,
      bannedIps: this.bannedIps.size,
      suspiciousActivities: this.suspiciousActivities.size
    };
  }
}

// ==========================================
// WEBHOOK SECURITY
// ==========================================

export class WebhookSecurity {
  // Verify webhook signature (Stripe style)
  static verifyStripeWebhook(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const elements = signature.split(',');
      let timestamp: string | undefined;
      let signatures: string[] = [];

      for (const element of elements) {
        const [key, value] = element.split('=');
        if (key === 't') {
          timestamp = value;
        } else if (key === 'v1') {
          signatures.push(value);
        }
      }

      if (!timestamp || signatures.length === 0) {
        return false;
      }

      // Check timestamp (prevent replay attacks)
      const timestampNum = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      const tolerance = 300; // 5 minutes

      if (now - timestampNum > tolerance) {
        return false;
      }

      // Verify signature
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      return signatures.some(signature =>
        crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        )
      );
    } catch (error) {
      return false;
    }
  }

  // Verify Instagram webhook
  static verifyInstagramWebhook(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha1', secret)
        .update(payload)
        .digest('hex');

      const receivedSignature = signature.startsWith('sha1=') 
        ? signature.substring(5) 
        : signature;

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }
}

// ==========================================
// SECURITY EVENT LOGGER
// ==========================================

export class SecurityEventLogger {
  private static events: SecurityEvent[] = [];
  private static auditLogs: AuditLog[] = [];
  private static readonly MAX_EVENTS = 10000;
  private static readonly MAX_AUDIT_LOGS = 50000;

  // Log security event
  static logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.events.push(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Alert on critical events
    if (event.severity === 'CRITICAL') {
      this.alertCriticalEvent(securityEvent);
    }

    console.log(`🚨 [SECURITY EVENT] ${event.type}: ${event.severity}`, {
      userId: event.userId,
      ip: event.ipAddress,
      details: event.details
    });
  }

  // Log audit event
  static logAudit(audit: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const auditLog: AuditLog = {
      ...audit,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.auditLogs.push(auditLog);
    
    // Keep only recent logs
    if (this.auditLogs.length > this.MAX_AUDIT_LOGS) {
      this.auditLogs = this.auditLogs.slice(-this.MAX_AUDIT_LOGS);
    }

    console.log(`📝 [AUDIT] ${audit.action} on ${audit.resource}`, {
      userId: audit.userId,
      success: audit.success,
      ip: audit.ipAddress
    });
  }

  // Get recent security events
  static getSecurityEvents(
    filter?: {
      type?: string;
      severity?: string;
      userId?: string;
      since?: Date;
    }
  ): SecurityEvent[] {
    let events = this.events;

    if (filter) {
      events = events.filter(event => {
        if (filter.type && event.type !== filter.type) return false;
        if (filter.severity && event.severity !== filter.severity) return false;
        if (filter.userId && event.userId !== filter.userId) return false;
        if (filter.since && event.timestamp < filter.since) return false;
        return true;
      });
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get audit logs
  static getAuditLogs(
    filter?: {
      userId?: string;
      action?: string;
      resource?: string;
      success?: boolean;
      since?: Date;
    }
  ): AuditLog[] {
    let logs = this.auditLogs;

    if (filter) {
      logs = logs.filter(log => {
        if (filter.userId && log.userId !== filter.userId) return false;
        if (filter.action && log.action !== filter.action) return false;
        if (filter.resource && log.resource !== filter.resource) return false;
        if (filter.success !== undefined && log.success !== filter.success) return false;
        if (filter.since && log.timestamp < filter.since) return false;
        return true;
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private static alertCriticalEvent(event: SecurityEvent): void {
    // In production, send to monitoring service, Slack, email, etc.
    console.error('🚨🚨 CRITICAL SECURITY EVENT 🚨🚨', event);
  }
}

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

export class SecurityMiddleware {
  private rateLimiter = new AdvancedRateLimiter();

  // Comprehensive security check
  async checkRequest(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
    riskScore: number;
    headers: Record<string, string>;
  }> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const path = new URL(request.url).pathname;

    // Rate limiting check
    const rateLimitResult = this.rateLimiter.checkAdvancedLimit(ip, path, request);
    
    if (!rateLimitResult.allowed) {
      SecurityEventLogger.logSecurityEvent({
        type: 'RATE_LIMIT',
        severity: rateLimitResult.riskScore > 70 ? 'HIGH' : 'MEDIUM',
        ipAddress: ip,
        userAgent,
        details: {
          endpoint: path,
          reason: rateLimitResult.reason,
          riskScore: rateLimitResult.riskScore
        }
      });

      return {
        allowed: false,
        reason: rateLimitResult.reason,
        riskScore: rateLimitResult.riskScore,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter || 60000)).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.retryAfter || 60000) / 1000).toString()
        }
      };
    }

    // Suspicious activity detection
    if (rateLimitResult.riskScore > 80) {
      SecurityEventLogger.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        ipAddress: ip,
        userAgent,
        details: {
          riskScore: rateLimitResult.riskScore,
          endpoint: path
        }
      });
    }

    return {
      allowed: true,
      riskScore: rateLimitResult.riskScore,
      headers: {}
    };
  }

  private getClientIP(request: NextRequest): string {
    // Try various headers in order of preference
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'x-forwarded', 
      'forwarded'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // Handle comma-separated IPs (take the first one)
        const ip = value.split(',')[0].trim();
        if (this.isValidIP(ip)) {
          return ip;
        }
      }
    }

    return '127.0.0.1'; // Fallback
  }

  private isValidIP(ip: string): boolean {
    // Simple IP validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
}

// ==========================================
// ENHANCED INPUT SANITIZATION
// ==========================================

export class AdvancedSanitizer extends InputValidator {
  // Sanitize Instagram captions with enhanced security
  static sanitizeInstagramCaption(caption: string): ValidationResult {
    let sanitized = caption.trim();
    
    // Remove potentially dangerous Unicode characters
    sanitized = sanitized.replace(/[\u200B-\u200F\u2028-\u202F\u205F-\u206F]/g, '');
    
    // Limit consecutive special characters
    sanitized = sanitized.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{5,}/g, 
      (match) => match.substring(0, 4));
    
    // Validate hashtags more strictly
    const hashtags = sanitized.match(/#[a-zA-Z0-9_]+/g) || [];
    for (const hashtag of hashtags) {
      if (hashtag.length > 30 || hashtag.length < 2) {
        return {
          isValid: false,
          errors: [`Invalid hashtag length: ${hashtag}`]
        };
      }
    }
    
    // Check for spam patterns
    if (this.containsSpamPatterns(sanitized)) {
      return {
        isValid: false,
        errors: ['Caption contains potential spam patterns']
      };
    }
    
    return {
      isValid: true,
      errors: [],
      sanitized
    };
  }

  private static containsSpamPatterns(text: string): boolean {
    const spamPatterns = [
      /click\s+here/gi,
      /follow\s+for\s+follow/gi,
      /dm\s+me/gi,
      /link\s+in\s+bio/gi,
      /free\s+money/gi,
      /make\s+\$\d+/gi,
      /guaranteed/gi
    ];
    
    const repetitivePattern = /(.{3,})\1{3,}/gi; // Repeated patterns
    
    return spamPatterns.some(pattern => pattern.test(text)) || 
           repetitivePattern.test(text);
  }
}

// ==========================================
// GLOBAL INSTANCES
// ==========================================

export const securityMiddleware = new SecurityMiddleware();
export const advancedRateLimiter = new AdvancedRateLimiter();

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function createSecureHeaders(): Record<string, string> {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co",
      "frame-src 'self' https://accounts.google.com"
    ].join('; ')
  };
}

export default {
  EncryptionManager,
  AdvancedRateLimiter,
  WebhookSecurity,
  SecurityEventLogger,
  SecurityMiddleware,
  AdvancedSanitizer
};