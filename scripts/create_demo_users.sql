-- Create demo users manually
-- Run these SQL commands in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo users
INSERT INTO users (id, email, password, name, role, created_at, updated_at) VALUES
(
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'admin@instaflow.com',
    '$2b$10$5XCrvfKVEfjQ0QRe1X6xuOUsQSLeAgy34hzylgUPkz3vam5KQOCzK',
    'システム管理者',
    'admin',
    NOW(),
    NOW()
),
(
    'b2c3d4e5-f6a7-8901-2345-678901bcdefg',
    'ktg.shota@gmail.com',
    '$2b$10$sG.yBSDO33VP5Ncy4xxEP.H0GMXqgRbvMSc9O6wCe8o0TImAR/dA2',
    'KTG管理者',
    'admin',
    NOW(),
    NOW()
),
(
    'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
    'user@instaflow.com',
    '$2b$10$CO9UsATpYlAr7AG6Qo/HTO1.ok3LF132dEsPJS.mri.8B1P3V/D1S',
    '一般ユーザー',
    'user',
    NOW(),
    NOW()
),
(
    'd4e5f6a7-b8c9-0123-4567-890123defghi',
    'demo@instaflow.com',
    '$2b$10$xyz123ABC456def789ghi012jkl345mno',
    'デモユーザー',
    'user',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT id, email, name, role, created_at FROM users ORDER BY created_at;