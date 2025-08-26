-- Demo Data for Instagram Automation Platform
-- Insert sample users, posts, hashtags, and other data

-- Demo users (passwords are bcrypt hashed)
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

-- Demo Instagram accounts
INSERT INTO instagram_accounts (id, user_id, instagram_user_id, username, access_token, profile_picture_url, followers_count, following_count, posts_count, is_connected, created_at, updated_at) VALUES
(
    'e5f6a7b8-c9d0-1234-5678-901234efghij',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    '17841400008460056',
    'instaflow_admin',
    'mock_access_token_admin',
    'https://scontent.cdninstagram.com/v/admin_profile.jpg',
    15420,
    289,
    156,
    true,
    NOW(),
    NOW()
),
(
    'f6a7b8c9-d0e1-2345-6789-012345fghijk',
    'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
    '17841400008460057',
    'instaflow_user',
    'mock_access_token_user',
    'https://scontent.cdninstagram.com/v/user_profile.jpg',
    3250,
    156,
    89,
    true,
    NOW(),
    NOW()
),
(
    'a7b8c9d0-e1f2-3456-7890-123456ghijkl',
    'd4e5f6a7-b8c9-0123-4567-890123defghi',
    '17841400008460058',
    'demo_account',
    'mock_access_token_demo',
    'https://scontent.cdninstagram.com/v/demo_profile.jpg',
    892,
    234,
    45,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (instagram_user_id) DO NOTHING;

-- Demo posts
INSERT INTO posts (id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, hashtags, ai_generated, likes_count, comments_count, reach, impressions, created_at, updated_at) VALUES
(
    'b8c9d0e1-f2a3-4567-8901-234567hijklm',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'e5f6a7b8-c9d0-1234-5678-901234efghij',
    '🚀 Instagramマーケティングの新時代が始まります！ AIを活用した投稿管理で、より効果的なコンテンツ戦略を実現しましょう。',
    'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1080',
    'published',
    NULL,
    NOW() - INTERVAL '2 days',
    ARRAY['#Instagram', '#マーケティング', '#AI', '#SNS戦略', '#デジタルマーケティング'],
    true,
    234,
    18,
    1520,
    2890,
    NOW() - INTERVAL '2 days',
    NOW()
),
(
    'c9d0e1f2-a3b4-5678-9012-345678ijklmn',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'e5f6a7b8-c9d0-1234-5678-901234efghij',
    '📈 今月のパフォーマンス分析結果をお届け！ エンゲージメント率が先月比120%向上しました。継続的な改善が成功の鍵です。',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080',
    'published',
    NULL,
    NOW() - INTERVAL '5 days',
    ARRAY['#分析', '#パフォーマンス', '#エンゲージメント', '#成長', '#データドリブン'],
    true,
    156,
    12,
    980,
    1750,
    NOW() - INTERVAL '5 days',
    NOW()
),
(
    'd0e1f2a3-b4c5-6789-0123-456789jklmno',
    'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
    'f6a7b8c9-d0e1-2345-6789-012345fghijk',
    '✨ 今日の一枚は夕日を背景に撮影しました。自然の美しさを通じて、日常の素晴らしい瞬間を共有していきます。',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080',
    'published',
    NULL,
    NOW() - INTERVAL '1 day',
    ARRAY['#夕日', '#自然', '#写真', '#日常', '#美しい瞬間'],
    false,
    89,
    7,
    425,
    650,
    NOW() - INTERVAL '1 day',
    NOW()
),
(
    'e1f2a3b4-c5d6-7890-1234-567890klmnop',
    'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
    'f6a7b8c9-d0e1-2345-6789-012345fghijk',
    '🎯 明日の朝10時に新しいコンテンツを公開予定です！お楽しみに。コミュニティの皆様と素敵な時間を共有できることを楽しみにしています。',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080',
    'scheduled',
    NOW() + INTERVAL '1 day',
    NULL,
    ARRAY['#予告', '#新コンテンツ', '#コミュニティ', '#楽しみ', '#シェア'],
    true,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
),
(
    'f2a3b4c5-d6e7-8901-2345-678901lmnopq',
    'd4e5f6a7-b8c9-0123-4567-890123defghi',
    'a7b8c9d0-e1f2-3456-7890-123456ghijkl',
    '💡 クリエイティブなアイデアを形にする過程をご紹介。デザインの力で世界をもっと美しく、機能的にしていきたいと思います。',
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1080',
    'draft',
    NULL,
    NULL,
    ARRAY['#クリエイティブ', '#デザイン', '#アイデア', '#美', '#機能性'],
    false,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Demo hashtags
INSERT INTO hashtags (id, user_id, name, category, usage_count, performance_score, is_trending, created_at, updated_at) VALUES
(
    'a3b4c5d6-e7f8-9012-3456-789012mnopqr',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'Instagram',
    'マーケティング',
    15,
    4.2,
    true,
    NOW(),
    NOW()
),
(
    'b4c5d6e7-f8a9-0123-4567-890123nopqrs',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'AI',
    'テクノロジー',
    12,
    3.8,
    true,
    NOW(),
    NOW()
),
(
    'c5d6e7f8-a9b0-1234-5678-901234opqrst',
    'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
    '写真',
    'アート',
    8,
    3.5,
    false,
    NOW(),
    NOW()
),
(
    'd6e7f8a9-b0c1-2345-6789-012345pqrstu',
    'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
    '自然',
    'ライフスタイル',
    6,
    4.0,
    false,
    NOW(),
    NOW()
),
(
    'e7f8a9b0-c1d2-3456-7890-123456qrstuv',
    'd4e5f6a7-b8c9-0123-4567-890123defghi',
    'デザイン',
    'クリエイティブ',
    4,
    3.2,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (user_id, name) DO NOTHING;

-- Demo content templates
INSERT INTO content_templates (id, user_id, name, content, category, hashtags, is_favorite, usage_count, created_at, updated_at) VALUES
(
    'f8a9b0c1-d2e3-4567-8901-234567rstuvw',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'マーケティング投稿テンプレート',
    '🚀 [商品・サービス名]の新機能をご紹介！\n\n✨ 主な特徴：\n• [特徴1]\n• [特徴2] \n• [特徴3]\n\n詳しくはプロフィールのリンクから→',
    'マーケティング',
    ARRAY['#新機能', '#マーケティング', '#ビジネス'],
    true,
    8,
    NOW(),
    NOW()
),
(
    'a9b0c1d2-e3f4-5678-9012-345678stuvwx',
    'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
    'ライフスタイル投稿テンプレート',
    '✨ [今日の出来事・体験]について\n\n[詳細な説明や感想]\n\n皆さんは[関連する質問]いかがですか？\nコメントで教えてください💭',
    'ライフスタイル',
    ARRAY['#ライフスタイル', '#日常', '#シェア'],
    false,
    3,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Demo post analytics
INSERT INTO post_analytics (id, post_id, date, likes, comments, shares, saves, reach, impressions, profile_visits, website_clicks, created_at) VALUES
(
    'b0c1d2e3-f4a5-6789-0123-456789tuvwxy',
    'b8c9d0e1-f2a3-4567-8901-234567hijklm',
    (NOW() - INTERVAL '2 days')::date,
    234,
    18,
    12,
    45,
    1520,
    2890,
    89,
    23,
    NOW()
),
(
    'c1d2e3f4-a5b6-7890-1234-567890uvwxyz',
    'c9d0e1f2-a3b4-5678-9012-345678ijklmn',
    (NOW() - INTERVAL '5 days')::date,
    156,
    12,
    8,
    29,
    980,
    1750,
    67,
    15,
    NOW()
),
(
    'd2e3f4a5-b6c7-8901-2345-678901vwxyza',
    'd0e1f2a3-b4c5-6789-0123-456789jklmno',
    (NOW() - INTERVAL '1 day')::date,
    89,
    7,
    3,
    18,
    425,
    650,
    34,
    8,
    NOW()
)
ON CONFLICT (post_id, date) DO NOTHING;