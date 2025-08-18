-- Database initialization script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instagram accounts table
CREATE TABLE IF NOT EXISTS instagram_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instagram_user_id VARCHAR(255) UNIQUE,
    username VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    profile_picture_url TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
    caption TEXT,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    instagram_post_id VARCHAR(255),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires);
CREATE INDEX idx_hashtags_user_id ON hashtags(user_id);
CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_category ON hashtags(category);

-- Insert seed data
-- Admin user (password: admin123)
INSERT INTO users (id, email, password, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@instaflow.com', '$2b$10$rKZt8JGjNlcE7VBhMpDJTu.nNPQgkV.QG8Q7H9mJfHhHzOiJdKcCu', 'Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Test user (password: test123)
INSERT INTO users (id, email, password, name, role) VALUES 
('00000000-0000-0000-0000-000000000002', 'test@instaflow.com', '$2b$10$8yJGFqJ4T4F.dKs2HNRdquNZRCz5P7m6tN4LQkrqJZE7VjL1KEyUC', 'Test User', 'user')
ON CONFLICT (email) DO NOTHING;
