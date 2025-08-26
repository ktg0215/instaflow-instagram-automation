# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Production build 
npm run start                  # Production server
npm run lint                   # ESLint checking
npm run test                   # Jest unit tests
npm run test:watch             # Jest test watch mode
npm run test:coverage          # Jest coverage reports

# Playwright E2E Testing
npx playwright test            # Run all Playwright tests
npx playwright test --ui       # Run tests with UI mode
npx playwright show-report     # View test results

# Supabase Database Management
# Database is hosted on Supabase - no local setup required
```

## Architecture Overview

This is a **Next.js 15 Instagram automation platform** with custom JWT authentication and Supabase PostgreSQL integration.

### Core Technical Stack
- **Next.js 15** with App Router (React 19)
- **Supabase PostgreSQL** with direct SQL queries (no ORM)
- **Custom JWT authentication** (despite NextAuth imports, uses custom implementation)
- **React Query** for server state management
- **Google Gemini AI** for content generation
- **Supabase hosted database** for cloud deployment

### Critical Server/Client Separation

**Webpack Configuration**: The `next.config.ts` contains essential configuration to prevent PostgreSQL bundling client-side:

```javascript
// Server-only packages excluded from client bundle
serverExternalPackages: ['pg', 'pg-connection-string', 'jsonwebtoken']

// Client-side fallbacks to prevent bundling errors
resolve.fallback = { pg: false, 'pg-native': false, ... }
```

**Server-Only Imports**: All server modules include `import 'server-only'` and use dynamic imports in API routes:

```javascript
// Dynamic import to prevent client-side bundling
const { default: database } = await import('@/lib/database')
```

### Service Layer Architecture

Business logic is organized into domain services:

- **`postService.ts`** - Post CRUD operations with PostgreSQL
- **`instagramService.ts`** - Instagram Graph API integration (mock + real)
- **`aiService.ts`** - Google Gemini AI integration (gemini-1.5-flash model)
- **`hashtagService.ts`** - Hashtag management system

### Authentication System

**Custom JWT Implementation**:
1. User authenticates via `/api/auth/signin`
2. JWT token (7-day expiry) stored in localStorage
3. Middleware protects routes: `/dashboard`, `/create`, `/schedule`, `/analytics`, `/settings`
4. AuthContext manages global auth state with React Query

**Route Protection**: `middleware.ts` validates JWT tokens and redirects unauthorized users.

## Database Architecture

**Connection**: Singleton connection pool in `/lib/database.ts` with health checks.

**Core Tables**:
```sql
users (id, email, password, name, role, created_at, updated_at)
instagram_accounts (id, user_id, instagram_user_id, access_token, expires_at, ...)
posts (id, user_id, caption, image_url, status, scheduled_at, instagram_post_id, ...)
hashtags (id, user_id, name, category, usage_count, created_at, ...)
sessions (id, user_id, session_token, expires, created_at)
```

**Database Pattern**: Direct SQL queries using `database.query()` - no ORM for performance.

**Seeded Data**: 
- Admin: `ktg.shota@gmail.com` / `ktg19850215`  
- Test: `test@example.com` / `test123`

## API Route Structure

```
/api/auth/          - Authentication (signin, signup, me)
/api/posts/         - Post management CRUD
/api/instagram/     - Instagram API integration (profile, media, publish, disconnect)
/api/ai/generate/   - AI content generation (Google Gemini)
/api/hashtags/      - Hashtag management CRUD
/api/health/        - System health checks (basic + database)
```

**Error Handling Pattern**: All API routes use safe JSON parsing to prevent HTML response errors:

```javascript
if (!response.ok) {
  let errorMessage = 'Default error message'
  try {
    const error = await response.json()
    errorMessage = error.error || errorMessage
  } catch {
    // HTML response or invalid JSON - use default message
  }
  throw new Error(errorMessage)
}
```

## External Service Integrations

**Instagram Graph API**: 
- Mock implementation for development without API keys
- Real integration with proper token management
- Features: profile data, media retrieval, post creation
- Error handling for rate limits and token expiry

**Google Gemini AI**:
- **Model**: `gemini-1.5-flash`
- **Integration**: `@google/generative-ai` SDK
- **Features**: Instagram caption generation with system prompts
- **Environment**: `NEXT_PUBLIC_GOOGLE_AI_API_KEY`

**Development Philosophy**: All external services have mock implementations enabling full development without API keys.

## Environment Variables

```bash
# Core Authentication
JWT_SECRET=your-secret
NEXTAUTH_SECRET=your-secret  # Used as JWT fallback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# External APIs (Optional for development)
INSTAGRAM_ACCESS_TOKEN=your-token
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your-key
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
```

## Development Workflow

**Supabase-First Development**: Database is hosted on Supabase - no local setup required.

**Health Checks**: 
- `/api/health` - Basic app health
- `/api/health/db` - Database connection (should return `{ ok: true }`)

**Mock Development**: Core features work without external API keys using mocks.

**Hot Reload**: Next.js development server supports hot reload out of the box.

## Key Architectural Files

**Essential Files**:
- `/lib/database.ts` - PostgreSQL connection pool and health checks
- `/middleware.ts` - JWT validation and route protection
- `/context/AuthContext.tsx` - Global authentication state management
- `/next.config.ts` - Critical webpack configuration for server/client separation
- `/services/` - All business logic and external API integrations
- `/init.sql` - Database schema and seed data

**Component Organization**:
- `/components/` - Reusable UI components
- `/app/` - App Router pages and API routes
- `/hooks/` - Custom React hooks with React Query
- `/types/` - TypeScript definitions

## Current Implementation Status

**Phase 8 - Advanced Post Creation**: Instagram post creation with AI integration, hashtag management, and scheduled posting.

**Completed Features**:
- ✅ Custom JWT authentication system
- ✅ PostgreSQL integration with health monitoring
- ✅ Post CRUD operations with React Query
- ✅ Google Gemini AI integration
- ✅ Instagram API mock/real implementations
- ✅ Hashtag management system
- ✅ Scheduled posting functionality
- ✅ Supabase cloud database integration
- ✅ Comprehensive error handling
- ✅ Server/client separation (PostgreSQL bundling issue resolved)

**Current Development Focus**:
- Responsive UI optimization
- UX improvements and performance optimization
- Enhanced Instagram API integration

## Important Implementation Patterns

**Type Safety**: Full TypeScript with custom interfaces in `/types/`.

**State Management**: 
- Server state: React Query with 5-minute stale time
- Client state: React Context patterns
- Authentication: AuthContext with localStorage persistence

**Testing Strategy**: 
- **Unit Tests**: Jest + React Testing Library for components and utilities
- **E2E Tests**: Playwright with multi-browser support (Chrome, Firefox, Safari)
- **Test Coverage**: Automated coverage reports with Jest

**Security**: 
- JWT tokens with 7-day expiry
- bcrypt password hashing (10 salt rounds)
- Middleware-based route protection
- Input validation and sanitization

## Supabase Configuration

**Database**: Hosted PostgreSQL on Supabase with built-in management tools.

**Development**: Access database via Supabase dashboard or direct PostgreSQL connection.

## Common Development Tasks

**Database Operations**:
- Use Supabase dashboard for visual database management
- Direct SQL queries via MCP Supabase integration
- Health checks via `/api/health/db` endpoint

**API Testing**:
```bash
# Health checks
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/db

# Authentication test
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

This architecture prioritizes type safety, development velocity, and maintainability while providing robust Instagram automation capabilities.