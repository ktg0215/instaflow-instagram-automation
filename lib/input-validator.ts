// SECURITY: Comprehensive input validation and sanitization library

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Common validation patterns
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9._-]{3,30}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  instagramUrl: /^https:\/\/(www\.)?(instagram\.com|cdninstagram\.com)/,
  hashtag: /^#[a-zA-Z0-9_]{1,30}$/
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export class InputValidator {
  
  // SECURITY: Email validation with sanitization
  static validateEmail(email: any): ValidationResult {
    const errors: string[] = [];
    
    if (!email || typeof email !== 'string') {
      return { isValid: false, errors: ['Email is required'] };
    }
    
    const sanitized = email.toLowerCase().trim();
    
    if (sanitized.length > 254) {
      errors.push('Email is too long');
    }
    
    if (!VALIDATION_PATTERNS.email.test(sanitized)) {
      errors.push('Invalid email format');
    }
    
    // SECURITY: Check for dangerous characters
    if (sanitized.includes('<') || sanitized.includes('>') || sanitized.includes('"')) {
      errors.push('Email contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
  
  // SECURITY: Password validation with strength requirements
  static validatePassword(password: any): ValidationResult {
    const errors: string[] = [];
    
    if (!password || typeof password !== 'string') {
      return { isValid: false, errors: ['Password is required'] };
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password is too long (max 128 characters)');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    // SECURITY: Check for common weak passwords
    const commonPasswords = ['password', '123456789', 'qwerty123', 'admin123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? password : undefined
    };
  }
  
  // SECURITY: Text content validation with XSS prevention
  static validateText(text: any, maxLength: number = 1000): ValidationResult {
    const errors: string[] = [];
    
    if (!text || typeof text !== 'string') {
      return { isValid: false, errors: ['Text is required'] };
    }
    
    if (text.length > maxLength) {
      errors.push(`Text is too long (max ${maxLength} characters)`);
    }
    
    // SECURITY: Sanitize HTML content
    const sanitized = purify.sanitize(text.trim(), { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
    
    // SECURITY: Check for potential XSS attempts
    if (text !== sanitized) {
      errors.push('Text contains potentially dangerous content');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
  
  // SECURITY: URL validation with whitelist
  static validateUrl(url: any, allowedDomains?: string[]): ValidationResult {
    const errors: string[] = [];
    
    if (!url || typeof url !== 'string') {
      return { isValid: false, errors: ['URL is required'] };
    }
    
    const sanitized = url.trim();
    
    if (!VALIDATION_PATTERNS.url.test(sanitized)) {
      errors.push('Invalid URL format');
    }
    
    try {
      const urlObj = new URL(sanitized);
      
      // SECURITY: Only allow HTTPS URLs
      if (urlObj.protocol !== 'https:') {
        errors.push('Only HTTPS URLs are allowed');
      }
      
      // SECURITY: Check domain whitelist
      if (allowedDomains && !allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
        errors.push('URL domain is not allowed');
      }
      
      // SECURITY: Block localhost and private IPs
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname.startsWith('127.') ||
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.') ||
          urlObj.hostname.includes('169.254.')) {
        errors.push('Private/local URLs are not allowed');
      }
      
    } catch {
      errors.push('Invalid URL format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
  
  // SECURITY: Instagram media URL validation
  static validateInstagramUrl(url: any): ValidationResult {
    const errors: string[] = [];
    
    if (!url || typeof url !== 'string') {
      return { isValid: false, errors: ['Instagram URL is required'] };
    }
    
    const sanitized = url.trim();
    
    if (!VALIDATION_PATTERNS.instagramUrl.test(sanitized)) {
      errors.push('URL must be from Instagram CDN');
    }
    
    const urlResult = this.validateUrl(sanitized, ['instagram.com', 'cdninstagram.com']);
    if (!urlResult.isValid) {
      errors.push(...urlResult.errors);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
  
  // SECURITY: Caption validation for Instagram posts
  static validateCaption(caption: any): ValidationResult {
    const errors: string[] = [];
    
    if (!caption || typeof caption !== 'string') {
      return { isValid: false, errors: ['Caption is required'] };
    }
    
    const sanitized = caption.trim();
    
    // Instagram caption limit
    if (sanitized.length > 2200) {
      errors.push('Caption is too long (max 2200 characters)');
    }
    
    if (sanitized.length < 1) {
      errors.push('Caption cannot be empty');
    }
    
    // SECURITY: Check for excessive hashtags (Instagram limit is 30)
    const hashtags = sanitized.match(/#\w+/g) || [];
    if (hashtags.length > 30) {
      errors.push('Too many hashtags (max 30)');
    }
    
    // SECURITY: Validate each hashtag
    for (const hashtag of hashtags) {
      if (!VALIDATION_PATTERNS.hashtag.test(hashtag)) {
        errors.push(`Invalid hashtag format: ${hashtag}`);
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
  
  // SECURITY: UUID validation
  static validateUUID(uuid: any): ValidationResult {
    const errors: string[] = [];
    
    if (!uuid || typeof uuid !== 'string') {
      return { isValid: false, errors: ['ID is required'] };
    }
    
    const sanitized = uuid.trim().toLowerCase();
    
    if (!VALIDATION_PATTERNS.uuid.test(sanitized)) {
      errors.push('Invalid ID format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
  
  // SECURITY: Date validation
  static validateDate(date: any): ValidationResult {
    const errors: string[] = [];
    
    if (!date) {
      return { isValid: false, errors: ['Date is required'] };
    }
    
    let dateObj: Date;
    
    try {
      dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        errors.push('Invalid date format');
      }
      
      // SECURITY: Check for reasonable date range (not too far in past/future)
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (dateObj < oneYearAgo || dateObj > oneYearAhead) {
        errors.push('Date must be within one year range');
      }
      
    } catch {
      errors.push('Invalid date format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? dateObj : undefined
    };
  }
  
  // SECURITY: General object validation
  static validateObject(obj: any, schema: Record<string, (value: any) => ValidationResult>): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};
    
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { isValid: false, errors: ['Invalid object'] };
    }
    
    // Validate each field according to schema
    for (const [key, validator] of Object.entries(schema)) {
      const result = validator(obj[key]);
      
      if (!result.isValid) {
        errors.push(...result.errors.map(error => `${key}: ${error}`));
      } else {
        sanitized[key] = result.sanitized;
      }
    }
    
    // SECURITY: Check for unexpected fields
    const allowedKeys = Object.keys(schema);
    const actualKeys = Object.keys(obj);
    const unexpectedKeys = actualKeys.filter(key => !allowedKeys.includes(key));
    
    if (unexpectedKeys.length > 0) {
      errors.push(`Unexpected fields: ${unexpectedKeys.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
}