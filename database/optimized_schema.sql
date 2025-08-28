-- ==========================================
-- OPTIMIZED DATABASE SCHEMA
-- Instagram Automation Platform
-- Supabase PostgreSQL with RLS
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ==========================================
-- SUBSCRIPTION & USAGE TRACKING TABLES
-- ==========================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    monthly_posts_limit INTEGER NOT NULL,
    max_accounts INTEGER NOT NULL,
    max_hashtag_sets INTEGER NOT NULL,
    has_scheduling BOOLEAN DEFAULT false,
    has_analytics BOOLEAN DEFAULT false,
    has_ai_generation BOOLEAN DEFAULT false,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, description, monthly_posts_limit, max_accounts, max_hashtag_sets, has_scheduling, has_analytics, has_ai_generation, price_monthly, price_yearly) VALUES
('Free', '基本プラン - 月5投稿まで', 5, 1, 1, false, false, false, 0.00, 0.00),
('Standard', 'スタンダードプラン - 月20投稿', 20, 3, 3, true, true, false, 980.00, 9800.00),
('Pro', 'プロプラン - 月40投稿', 40, 5, 5, true, true, true, 1980.00, 19800.00)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- CORE USER TABLES - ENHANCED
-- ==========================================

-- Users table with subscription info
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Optional for OAuth users
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_plan_id UUID REFERENCES subscription_plans(id) DEFAULT (SELECT id FROM subscription_plans WHERE name = 'Free'),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trialing')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    oauth_provider VARCHAR(50), -- 'google', 'local', etc.
    oauth_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(oauth_provider, oauth_id)
);

-- Usage tracking table for plan limits
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    posts_created INTEGER DEFAULT 0,
    posts_published INTEGER DEFAULT 0,
    ai_requests INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, month_year)
);

-- ==========================================
-- INSTAGRAM ACCOUNTS - ENHANCED
-- ==========================================

CREATE TABLE IF NOT EXISTS instagram_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instagram_user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT[], -- Instagram permissions granted
    profile_picture_url TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    account_type VARCHAR(50) DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'creator')),
    is_connected BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint per user
    UNIQUE(user_id, instagram_user_id)
);

-- ==========================================
-- POSTS TABLE - ENHANCED
-- ==========================================

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
    caption TEXT NOT NULL,
    image_url TEXT,
    image_path TEXT,
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'carousel')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'processing')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    instagram_post_id VARCHAR(255),
    permalink TEXT,
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    
    -- AI and hashtag data
    hashtags TEXT[],
    ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    ai_model VARCHAR(50),
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadata
    tags VARCHAR(100)[],
    location VARCHAR(255),
    alt_text TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- HASHTAGS - ENHANCED
-- ==========================================

CREATE TABLE IF NOT EXISTS hashtag_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hashtags TEXT[] NOT NULL,
    category VARCHAR(100),
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    avg_engagement DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Individual hashtag tracking for analytics
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- without # prefix
    category VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    performance_score DECIMAL(3,2),
    avg_likes DECIMAL(8,2),
    avg_comments DECIMAL(8,2),
    avg_reach INTEGER,
    is_trending BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- ==========================================
-- ENHANCED ANALYTICS TABLES
-- ==========================================

-- Daily post analytics for detailed tracking
CREATE TABLE IF NOT EXISTS post_analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    profile_visits INTEGER DEFAULT 0,
    website_clicks INTEGER DEFAULT 0,
    story_replies INTEGER DEFAULT 0,
    story_exits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, date)
);

-- User analytics summary (materialized for performance)
CREATE MATERIALIZED VIEW user_analytics_summary AS
SELECT 
    u.id as user_id,
    COUNT(p.id) as total_posts,
    COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_posts,
    COUNT(CASE WHEN p.status = 'scheduled' THEN 1 END) as scheduled_posts,
    SUM(p.likes_count) as total_likes,
    SUM(p.comments_count) as total_comments,
    SUM(p.reach) as total_reach,
    AVG(p.engagement_rate) as avg_engagement_rate,
    MAX(p.published_at) as last_post_date,
    COUNT(DISTINCT p.instagram_account_id) as active_accounts
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.is_active = true
GROUP BY u.id;

-- Create index on materialized view
CREATE UNIQUE INDEX ON user_analytics_summary(user_id);

-- ==========================================
-- SESSION & AUDIT TABLES
-- ==========================================

-- Enhanced sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- EXTERNAL SERVICE TABLES
-- ==========================================

-- AI requests tracking for cost management
CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image')),
    model VARCHAR(50) NOT NULL,
    input_prompt TEXT NOT NULL,
    result_data JSONB,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'timeout')),
    error_message TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events for external integrations
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL, -- 'stripe', 'instagram', etc.
    event_type VARCHAR(100) NOT NULL,
    webhook_id VARCHAR(255),
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- OPTIMIZED INDEXES FOR PERFORMANCE
-- ==========================================

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription ON users(subscription_plan_id, subscription_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Instagram accounts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instagram_accounts_connected ON instagram_accounts(user_id, is_connected) WHERE is_connected = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instagram_accounts_sync ON instagram_accounts(last_synced_at) WHERE is_connected = true;

-- Posts table indexes (optimized for common queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_status ON posts(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_instagram_account ON posts(instagram_account_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_engagement ON posts(engagement_rate DESC NULLS LAST) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);

-- Hashtags indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hashtags_user_performance ON hashtags(user_id, performance_score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hashtags_trending ON hashtags(is_trending, performance_score DESC) WHERE is_trending = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hashtag_sets_user ON hashtag_sets(user_id, is_favorite);

-- Analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_analytics_post_date ON post_analytics_daily(post_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_analytics_date ON post_analytics_daily(date) WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Session and audit indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_active ON sessions(user_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires ON sessions(expires) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- AI and usage indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_requests_user_date ON ai_requests(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_usage_month ON user_usage(user_id, month_year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_events_unprocessed ON webhook_events(created_at) WHERE processed = false;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Instagram accounts policies
CREATE POLICY "Users can manage own Instagram accounts" ON instagram_accounts
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Posts policies
CREATE POLICY "Users can manage own posts" ON posts
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Hashtags policies
CREATE POLICY "Users can manage own hashtags" ON hashtags
    FOR ALL USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage own hashtag sets" ON hashtag_sets
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Analytics policies
CREATE POLICY "Users can view own post analytics" ON post_analytics_daily
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_analytics_daily.post_id 
            AND posts.user_id::text = auth.uid()::text
        )
    );

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Usage policies
CREATE POLICY "Users can view own usage" ON user_usage
    FOR ALL USING (user_id::text = auth.uid()::text);

-- AI requests policies
CREATE POLICY "Users can view own AI requests" ON ai_requests
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Admin policies (bypass RLS for admin users)
CREATE POLICY "Admins have full access" ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.role = 'admin'
        )
    );

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to refresh user analytics materialized view
CREATE OR REPLACE FUNCTION refresh_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_analytics_summary;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update usage tracking
CREATE OR REPLACE FUNCTION update_user_usage()
RETURNS TRIGGER AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        INSERT INTO user_usage (user_id, month_year, posts_published)
        VALUES (NEW.user_id, current_month, 1)
        ON CONFLICT (user_id, month_year)
        DO UPDATE SET 
            posts_published = user_usage.posts_published + 1,
            updated_at = NOW();
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO user_usage (user_id, month_year, posts_created)
        VALUES (NEW.user_id, current_month, 1)
        ON CONFLICT (user_id, month_year)
        DO UPDATE SET 
            posts_created = user_usage.posts_created + 1,
            updated_at = NOW();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function to audit significant actions
CREATE OR REPLACE FUNCTION audit_user_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::text,
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Updated timestamp triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instagram_accounts_updated_at ON instagram_accounts;
CREATE TRIGGER update_instagram_accounts_updated_at 
    BEFORE UPDATE ON instagram_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hashtags_updated_at ON hashtags;
CREATE TRIGGER update_hashtags_updated_at 
    BEFORE UPDATE ON hashtags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hashtag_sets_updated_at ON hashtag_sets;
CREATE TRIGGER update_hashtag_sets_updated_at 
    BEFORE UPDATE ON hashtag_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usage tracking trigger
DROP TRIGGER IF EXISTS posts_usage_tracking ON posts;
CREATE TRIGGER posts_usage_tracking
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_user_usage();

-- Analytics refresh trigger (run after bulk operations)
DROP TRIGGER IF EXISTS refresh_analytics_on_posts ON posts;
CREATE TRIGGER refresh_analytics_on_posts
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_user_analytics();

-- Audit triggers for sensitive operations
DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
    AFTER UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_user_action();

DROP TRIGGER IF EXISTS audit_posts ON posts;
CREATE TRIGGER audit_posts
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION audit_user_action();

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- User dashboard summary view
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    sp.name as plan_name,
    sp.monthly_posts_limit,
    uu.posts_created as posts_this_month,
    uu.posts_published as published_this_month,
    (sp.monthly_posts_limit - COALESCE(uu.posts_created, 0)) as remaining_posts,
    COUNT(DISTINCT ia.id) as connected_accounts,
    COUNT(DISTINCT CASE WHEN p.status = 'scheduled' THEN p.id END) as scheduled_posts,
    COALESCE(uas.avg_engagement_rate, 0) as avg_engagement_rate
FROM users u
LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
LEFT JOIN user_usage uu ON u.id = uu.user_id AND uu.month_year = TO_CHAR(NOW(), 'YYYY-MM')
LEFT JOIN instagram_accounts ia ON u.id = ia.user_id AND ia.is_connected = true
LEFT JOIN posts p ON u.id = p.user_id
LEFT JOIN user_analytics_summary uas ON u.id = uas.user_id
WHERE u.is_active = true
GROUP BY u.id, u.name, u.email, sp.name, sp.monthly_posts_limit, uu.posts_created, uu.posts_published, uas.avg_engagement_rate;

-- Recent posts with engagement view
CREATE OR REPLACE VIEW recent_posts_with_metrics AS
SELECT 
    p.id,
    p.user_id,
    p.caption,
    p.image_url,
    p.status,
    p.published_at,
    p.likes_count,
    p.comments_count,
    p.engagement_rate,
    ia.username as instagram_username,
    array_length(p.hashtags, 1) as hashtag_count,
    CASE 
        WHEN p.published_at > NOW() - INTERVAL '24 hours' THEN 'recent'
        WHEN p.published_at > NOW() - INTERVAL '7 days' THEN 'week'
        ELSE 'older'
    END as recency
FROM posts p
LEFT JOIN instagram_accounts ia ON p.instagram_account_id = ia.id
WHERE p.status = 'published'
ORDER BY p.published_at DESC;

-- ==========================================
-- PERFORMANCE MONITORING
-- ==========================================

-- Enable query performance monitoring
SELECT pg_stat_statements_reset();

-- Create function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pss.query,
        pss.calls,
        pss.total_exec_time,
        pss.mean_exec_time,
        pss.rows
    FROM pg_stat_statements pss
    WHERE pss.mean_exec_time > min_duration_ms
    ORDER BY pss.mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized view initially
REFRESH MATERIALIZED VIEW user_analytics_summary;

-- ==========================================
-- COMMENTS AND DOCUMENTATION
-- ==========================================

-- This schema includes:
-- 1. Subscription management with plan limits
-- 2. Enhanced user tracking and OAuth support  
-- 3. Comprehensive analytics with materialized views
-- 4. Row Level Security for multi-tenant isolation
-- 5. Optimized indexes for common query patterns
-- 6. Audit logging for compliance
-- 7. Usage tracking for plan enforcement
-- 8. Performance monitoring capabilities
-- 9. Webhook management for external integrations
-- 10. AI request tracking for cost management

-- Deployment notes:
-- 1. Run this script on Supabase with appropriate user permissions
-- 2. Monitor index creation progress with: SELECT * FROM pg_stat_progress_create_index;
-- 3. Set up automated materialized view refresh every hour
-- 4. Configure pg_stat_statements extension for query monitoring
-- 5. Implement connection pooling with appropriate pool sizes
