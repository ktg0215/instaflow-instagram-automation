// ==========================================
// CENTRALIZED API RESPONSE SYSTEM
// Standardized response formatting and error handling
// ==========================================

import { NextResponse } from 'next/server';

// ==========================================
// TYPES AND INTERFACES
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
  meta?: ResponseMeta;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  trace?: string; // Only in development
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ResponseMeta {
  version: string;
  cached?: boolean;
  cacheExpiry?: string;
  executionTime?: number;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: string;
  };
}

// ==========================================
// ERROR DEFINITIONS
// ==========================================

export class ApiErrorCodes {
  // Authentication errors (40x)
  static readonly UNAUTHORIZED = 'UNAUTHORIZED';
  static readonly FORBIDDEN = 'FORBIDDEN';
  static readonly TOKEN_EXPIRED = 'TOKEN_EXPIRED';
  static readonly INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
  
  // Validation errors (40x)
  static readonly VALIDATION_ERROR = 'VALIDATION_ERROR';
  static readonly INVALID_INPUT = 'INVALID_INPUT';
  static readonly MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD';
  
  // Resource errors (40x)
  static readonly RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND';
  static readonly RESOURCE_CONFLICT = 'RESOURCE_CONFLICT';
  static readonly RESOURCE_GONE = 'RESOURCE_GONE';
  
  // Business logic errors (40x)
  static readonly PLAN_LIMIT_EXCEEDED = 'PLAN_LIMIT_EXCEEDED';
  static readonly INSTAGRAM_ACCOUNT_NOT_CONNECTED = 'INSTAGRAM_ACCOUNT_NOT_CONNECTED';
  static readonly INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS';
  static readonly SCHEDULE_TIME_INVALID = 'SCHEDULE_TIME_INVALID';
  
  // Rate limiting (429)
  static readonly RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED';
  
  // Server errors (50x)
  static readonly INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR';
  static readonly DATABASE_ERROR = 'DATABASE_ERROR';
  static readonly EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR';
  static readonly SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE';
}

export class ApiErrorMessages {
  private static readonly messages: Record<string, string> = {
    [ApiErrorCodes.UNAUTHORIZED]: '認証が必要です',
    [ApiErrorCodes.FORBIDDEN]: 'このリソースにアクセスする権限がありません',
    [ApiErrorCodes.TOKEN_EXPIRED]: 'トークンの有効期限が切れています',
    [ApiErrorCodes.INVALID_CREDENTIALS]: 'メールアドレスまたはパスワードが正しくありません',
    
    [ApiErrorCodes.VALIDATION_ERROR]: '入力値に誤りがあります',
    [ApiErrorCodes.INVALID_INPUT]: '無効な入力値です',
    [ApiErrorCodes.MISSING_REQUIRED_FIELD]: '必須フィールドが不足しています',
    
    [ApiErrorCodes.RESOURCE_NOT_FOUND]: 'リソースが見つかりません',
    [ApiErrorCodes.RESOURCE_CONFLICT]: 'リソースが既に存在します',
    [ApiErrorCodes.RESOURCE_GONE]: 'リソースは削除されています',
    
    [ApiErrorCodes.PLAN_LIMIT_EXCEEDED]: 'プランの上限に達しています',
    [ApiErrorCodes.INSTAGRAM_ACCOUNT_NOT_CONNECTED]: 'Instagramアカウントが接続されていません',
    [ApiErrorCodes.INSUFFICIENT_PERMISSIONS]: '権限が不足しています',
    [ApiErrorCodes.SCHEDULE_TIME_INVALID]: 'スケジュール時間が無効です',
    
    [ApiErrorCodes.RATE_LIMIT_EXCEEDED]: 'リクエスト上限に達しました。しばらく待ってから再試行してください',
    
    [ApiErrorCodes.INTERNAL_SERVER_ERROR]: 'サーバー内部エラーが発生しました',
    [ApiErrorCodes.DATABASE_ERROR]: 'データベースエラーが発生しました',
    [ApiErrorCodes.EXTERNAL_API_ERROR]: '外部APIエラーが発生しました',
    [ApiErrorCodes.SERVICE_UNAVAILABLE]: 'サービスが一時的に利用できません'
  };

  static getMessage(code: string, fallback?: string): string {
    return this.messages[code] || fallback || 'エラーが発生しました';
  }
}

// ==========================================
// CUSTOM ERROR CLASSES
// ==========================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly field?: string;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    message?: string,
    statusCode: number = 500,
    details?: Record<string, any>,
    field?: string
  ) {
    super(message || ApiErrorMessages.getMessage(code));
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types for better categorization
export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: Record<string, any>) {
    super(ApiErrorCodes.VALIDATION_ERROR, message, 400, details, field);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(code: string = ApiErrorCodes.UNAUTHORIZED, message?: string) {
    super(code, message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message?: string) {
    super(ApiErrorCodes.FORBIDDEN, message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'リソース') {
    super(ApiErrorCodes.RESOURCE_NOT_FOUND, `${resource}が見つかりません`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message?: string) {
    super(ApiErrorCodes.RESOURCE_CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(resetTime?: Date) {
    const details = resetTime ? { resetTime: resetTime.toISOString() } : undefined;
    super(ApiErrorCodes.RATE_LIMIT_EXCEEDED, undefined, 429, details);
    this.name = 'RateLimitError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(code: string, message?: string, details?: Record<string, any>) {
    super(code, message, 400, details);
    this.name = 'BusinessLogicError';
  }
}

// ==========================================
// RESPONSE BUILDER
// ==========================================

export class ApiResponseBuilder {
  private requestStartTime: number = Date.now();
  private requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId || this.generateRequestId();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Success responses
  success<T>(data: T, meta?: Partial<ResponseMeta>): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      meta: {
        version: '1.0',
        executionTime: Date.now() - this.requestStartTime,
        ...meta
      }
    };

    const status = this.determineSuccessStatus(meta);
    return NextResponse.json(response, { status });
  }

  // Success with pagination
  successWithPagination<T>(
    data: T[],
    pagination: PaginationInfo,
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse<T[]>> {
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      meta: {
        version: '1.0',
        executionTime: Date.now() - this.requestStartTime,
        ...meta
      }
    };

    return NextResponse.json(response, { status: 200 });
  }

  // Error responses
  error(error: AppError | Error): NextResponse<ApiResponse<null>> {
    const isAppError = error instanceof AppError;
    
    const apiError: ApiError = {
      code: isAppError ? error.code : ApiErrorCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
      details: isAppError ? error.details : undefined,
      field: isAppError ? error.field : undefined
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && !isAppError) {
      apiError.trace = error.stack;
    }

    const response: ApiResponse<null> = {
      success: false,
      error: apiError,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      meta: {
        version: '1.0',
        executionTime: Date.now() - this.requestStartTime
      }
    };

    const statusCode = isAppError ? error.statusCode : 500;
    
    // Log error for monitoring
    this.logError(error, statusCode);

    return NextResponse.json(response, { 
      status: statusCode,
      headers: this.getErrorHeaders(statusCode)
    });
  }

  // Validation error response
  validationError(
    errors: Array<{ field: string; message: string; code?: string }>
  ): NextResponse<ApiResponse<null>> {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: ApiErrorCodes.VALIDATION_ERROR,
        message: '入力値に誤りがあります',
        details: { validationErrors: errors }
      },
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      meta: {
        version: '1.0',
        executionTime: Date.now() - this.requestStartTime
      }
    };

    return NextResponse.json(response, { status: 400 });
  }

  private determineSuccessStatus(meta?: Partial<ResponseMeta>): number {
    // 201 for created resources
    if (meta && 'created' in meta) return 201;
    // 204 for no content (like DELETE)
    if (meta && 'noContent' in meta) return 204;
    // Default success
    return 200;
  }

  private getErrorHeaders(statusCode: number): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': this.requestId
    };

    if (statusCode === 429) {
      headers['Retry-After'] = '60';
    }

    return headers;
  }

  private logError(error: Error, statusCode: number): void {
    const isOperational = error instanceof AppError && error.isOperational;
    
    // Only log unexpected errors as errors
    if (!isOperational && statusCode >= 500) {
      console.error('🚨 [API ERROR]', {
        requestId: this.requestId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️  [API WARNING]', {
        requestId: this.requestId,
        error: error.message,
        code: error instanceof AppError ? error.code : 'UNKNOWN',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Create paginated response
export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

// Error handler middleware wrapper
export function withErrorHandling(
  handler: (req: any, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: any, ...args: any[]): Promise<NextResponse> => {
    const apiResponse = new ApiResponseBuilder(
      req.headers.get('x-request-id') || undefined
    );

    try {
      return await handler(req, ...args);
    } catch (error) {
      if (error instanceof AppError) {
        return apiResponse.error(error);
      }

      // Handle known framework errors
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          return apiResponse.error(
            new AppError(ApiErrorCodes.DATABASE_ERROR, 'データベースに接続できません', 503)
          );
        }

        if (error.message.includes('timeout')) {
          return apiResponse.error(
            new AppError(ApiErrorCodes.SERVICE_UNAVAILABLE, 'リクエストがタイムアウトしました', 504)
          );
        }
      }

      // Unexpected error
      return apiResponse.error(error instanceof Error ? error : new Error('予期しないエラーが発生しました'));
    }
  };
}

// Success response helpers
export function createSuccessResponse<T>(
  data: T,
  requestId?: string,
  meta?: Partial<ResponseMeta>
): NextResponse<ApiResponse<T>> {
  return new ApiResponseBuilder(requestId).success(data, meta);
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationInfo,
  requestId?: string,
  meta?: Partial<ResponseMeta>
): NextResponse<ApiResponse<T[]>> {
  return new ApiResponseBuilder(requestId).successWithPagination(data, pagination, meta);
}

// Error response helpers
export function createErrorResponse(
  error: AppError | Error,
  requestId?: string
): NextResponse<ApiResponse<null>> {
  return new ApiResponseBuilder(requestId).error(error);
}

// ==========================================
// TYPE GUARDS
// ==========================================

export function isApiError(error: any): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: any): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

// ==========================================
// RESPONSE STATUS HELPERS
// ==========================================

export class ResponseStatus {
  static readonly OK = 200;
  static readonly CREATED = 201;
  static readonly NO_CONTENT = 204;
  static readonly BAD_REQUEST = 400;
  static readonly UNAUTHORIZED = 401;
  static readonly FORBIDDEN = 403;
  static readonly NOT_FOUND = 404;
  static readonly CONFLICT = 409;
  static readonly UNPROCESSABLE_ENTITY = 422;
  static readonly TOO_MANY_REQUESTS = 429;
  static readonly INTERNAL_SERVER_ERROR = 500;
  static readonly BAD_GATEWAY = 502;
  static readonly SERVICE_UNAVAILABLE = 503;
  static readonly GATEWAY_TIMEOUT = 504;
}

// Export default for convenience
export default ApiResponseBuilder;