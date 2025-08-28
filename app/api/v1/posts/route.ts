// ==========================================
// IMPROVED POSTS API ENDPOINT
// RESTful design with comprehensive error handling and caching
// ==========================================

import { NextRequest } from 'next/server';
import { PostService } from '@/services/postService';
import { 
  ApiResponseBuilder, 
  withErrorHandling,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  BusinessLogicError,
  ApiErrorCodes,
  createPaginationInfo
} from '@/lib/api-response';
import { globalCache, CachePresets, createCacheKey } from '@/lib/performance';
import { securityMiddleware, SecurityEventLogger, AdvancedSanitizer } from '@/lib/security';
import { verifyAuth } from '@/lib/auth';

// ==========================================
// REQUEST/RESPONSE INTERFACES
// ==========================================

interface CreatePostRequest {
  caption: string;
  image_url?: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
  instagram_account_id?: string;
  hashtags?: string[];
  location?: string;
  alt_text?: string;
}

interface PostResponse {
  id: string;
  caption: string;
  image_url?: string;
  status: string;
  scheduled_at?: string;
  published_at?: string;
  instagram_account_id?: string;
  likes_count: number;
  comments_count: number;
  engagement_rate?: number;
  created_at: string;
  updated_at: string;
}

interface PostsListResponse {
  posts: PostResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    filters: Record<string, any>;
    sort: string;
  };
}

// ==========================================
// GET /api/v1/posts - ユーザーの投稿一覧取得
// ==========================================

export const GET = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = new ApiResponseBuilder(request.headers.get('x-request-id') || undefined);
  
  // Security check
  const securityResult = await securityMiddleware.checkRequest(request);
  if (!securityResult.allowed) {
    throw new BusinessLogicError(ApiErrorCodes.RATE_LIMIT_EXCEEDED, securityResult.reason);
  }

  // Authentication
  const user = await verifyAuth(request);
  if (!user) {
    SecurityEventLogger.logSecurityEvent({
      type: 'AUTH_FAILURE',
      severity: 'MEDIUM',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || '',
      details: { endpoint: '/api/v1/posts', method: 'GET' }
    });
    throw new AuthenticationError();
  }

  // Parse query parameters with validation
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const status = searchParams.get('status');
  const sort = searchParams.get('sort') || 'created_at:desc';
  const search = searchParams.get('search');

  // Validate status if provided
  if (status && !['draft', 'scheduled', 'published', 'failed'].includes(status)) {
    throw new ValidationError('Invalid status parameter', 'status');
  }

  // Validate sort parameter
  const validSortFields = ['created_at', 'published_at', 'likes_count', 'engagement_rate'];
  const [sortField, sortOrder] = sort.split(':');
  if (!validSortFields.includes(sortField) || !['asc', 'desc'].includes(sortOrder || 'desc')) {
    throw new ValidationError('Invalid sort parameter', 'sort');
  }

  // Cache key with user-specific data
  const cacheKey = createCacheKey(
    'posts',
    user.id,
    page.toString(),
    limit.toString(),
    status || 'all',
    sort,
    search || 'none'
  );

  // Get posts with caching
  const { posts, total } = await globalCache.get(
    cacheKey,
    async () => {
      const offset = (page - 1) * limit;
      
      let posts;
      if (status) {
        posts = await PostService.getPostsByStatus(String(user.id), status, limit, offset);
      } else if (search) {
        posts = await PostService.searchPosts(String(user.id), search, limit, offset);
      } else {
        posts = await PostService.getUserPosts(String(user.id), limit, offset, sortField, sortOrder);
      }

      // Get total count for pagination
      const totalCount = await PostService.getUserPostsCount(String(user.id), status, search);

      return { posts, total: totalCount };
    },
    CachePresets.USER(user.id)
  );

  // Create pagination info
  const pagination = createPaginationInfo(page, limit, total);

  // Format response
  const response: PostsListResponse = {
    posts: posts.map(formatPostResponse),
    pagination,
    meta: {
      filters: { status, search },
      sort
    }
  };

  // Log audit event
  SecurityEventLogger.logAudit({
    userId: String(user.id),
    action: 'LIST_POSTS',
    resource: 'posts',
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent') || '',
    success: true,
    details: { count: posts.length, filters: { status, search, sort } }
  });

  return apiResponse.successWithPagination(
    response.posts,
    pagination,
    {
      cached: true,
      filters: response.meta.filters
    }
  );
});

// ==========================================
// POST /api/v1/posts - 新規投稿作成
// ==========================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  const apiResponse = new ApiResponseBuilder(request.headers.get('x-request-id') || undefined);

  // Security check
  const securityResult = await securityMiddleware.checkRequest(request);
  if (!securityResult.allowed) {
    throw new BusinessLogicError(ApiErrorCodes.RATE_LIMIT_EXCEEDED, securityResult.reason);
  }

  // Authentication
  const user = await verifyAuth(request);
  if (!user) {
    throw new AuthenticationError();
  }

  // Parse and validate request body
  let body: CreatePostRequest;
  try {
    body = await request.json();
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }

  // Comprehensive input validation
  const validationErrors: Array<{ field: string; message: string }> = [];

  // Validate caption
  if (!body.caption || typeof body.caption !== 'string') {
    validationErrors.push({ field: 'caption', message: 'Caption is required' });
  } else {
    const captionValidation = AdvancedSanitizer.sanitizeInstagramCaption(body.caption);
    if (!captionValidation.isValid) {
      validationErrors.push({ 
        field: 'caption', 
        message: captionValidation.errors.join(', ') 
      });
    } else {
      body.caption = captionValidation.sanitized!;
    }
  }

  // Validate status
  if (body.status && !['draft', 'scheduled', 'published'].includes(body.status)) {
    validationErrors.push({ field: 'status', message: 'Invalid status value' });
  }

  // Validate scheduled_at for scheduled posts
  if (body.status === 'scheduled') {
    if (!body.scheduled_at) {
      validationErrors.push({ field: 'scheduled_at', message: 'Scheduled time is required for scheduled posts' });
    } else {
      const scheduledTime = new Date(body.scheduled_at);
      if (isNaN(scheduledTime.getTime())) {
        validationErrors.push({ field: 'scheduled_at', message: 'Invalid scheduled time format' });
      } else if (scheduledTime <= new Date()) {
        validationErrors.push({ field: 'scheduled_at', message: 'Scheduled time must be in the future' });
      }
    }
  }

  // Validate image URL if provided
  if (body.image_url) {
    const urlValidation = AdvancedSanitizer.validateInstagramUrl(body.image_url);
    if (!urlValidation.isValid) {
      validationErrors.push({ 
        field: 'image_url', 
        message: urlValidation.errors.join(', ') 
      });
    }
  }

  // Return validation errors if any
  if (validationErrors.length > 0) {
    return apiResponse.validationError(validationErrors);
  }

  // Check user plan limits
  const usageCheck = await PostService.checkUserPostLimit(String(user.id));
  if (!usageCheck.allowed) {
    throw new BusinessLogicError(
      ApiErrorCodes.PLAN_LIMIT_EXCEEDED,
      `Monthly post limit exceeded. Current: ${usageCheck.current}, Limit: ${usageCheck.limit}`
    );
  }

  // Verify Instagram account if specified
  if (body.instagram_account_id) {
    const accountExists = await PostService.verifyInstagramAccount(
      String(user.id),
      body.instagram_account_id
    );
    if (!accountExists) {
      throw new ValidationError(
        'Instagram account not found or not connected',
        'instagram_account_id'
      );
    }
  }

  try {
    // Create post
    const postData = {
      user_id: String(user.id),
      caption: body.caption,
      image_url: body.image_url || null,
      status: body.status || 'draft',
      scheduled_at: body.status === 'scheduled' ? body.scheduled_at : null,
      instagram_account_id: body.instagram_account_id || null,
      hashtags: body.hashtags || [],
      location: body.location || null,
      alt_text: body.alt_text || null
    };

    const post = await PostService.createPost(postData);

    // Invalidate user's posts cache
    await globalCache.invalidate([`user:${user.id}`]);

    // Schedule post if needed
    if (body.status === 'scheduled' && body.scheduled_at) {
      await PostService.schedulePost(post.id, new Date(body.scheduled_at));
    }

    // Log audit event
    SecurityEventLogger.logAudit({
      userId: String(user.id),
      action: 'CREATE_POST',
      resource: 'posts',
      resourceId: post.id,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || '',
      success: true,
      details: { status: post.status, hasImage: !!post.image_url }
    });

    return apiResponse.success(
      formatPostResponse(post),
      { created: true }
    );

  } catch (error) {
    // Log failed attempt
    SecurityEventLogger.logAudit({
      userId: String(user.id),
      action: 'CREATE_POST',
      resource: 'posts',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || '',
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });

    throw error;
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatPostResponse(post: any): PostResponse {
  return {
    id: post.id,
    caption: post.caption,
    image_url: post.image_url || undefined,
    status: post.status,
    scheduled_at: post.scheduled_at || undefined,
    published_at: post.published_at || undefined,
    instagram_account_id: post.instagram_account_id || undefined,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    engagement_rate: post.engagement_rate || undefined,
    created_at: post.created_at,
    updated_at: post.updated_at
  };
}

// ==========================================
// EXPORT ROUTE HANDLERS
// ==========================================

export { GET, POST };