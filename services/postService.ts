import 'server-only'

import database from '@/lib/database';

interface Post {
  id: string;
  user_id: string;
  instagram_account_id?: string | null;
  caption: string;
  image_url?: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string | null;
  published_at?: string | null;
  instagram_post_id?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

interface PostInsert {
  user_id: string;
  caption: string;
  image_url?: string | null;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string | null;
  instagram_account_id?: string | null;
}

interface PostUpdate {
  caption?: string;
  image_url?: string | null;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string | null;
  published_at?: string | null;
  instagram_post_id?: string | null;
  likes_count?: number;
  comments_count?: number;
}

export class PostService {
  static async createPost(postData: PostInsert): Promise<Post> {
    try {
      const result = await database.query(
        `INSERT INTO posts (user_id, caption, image_url, status, scheduled_at, instagram_account_id, likes_count, comments_count, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, 0, 0, NOW(), NOW()) 
         RETURNING id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, instagram_post_id, likes_count, comments_count, created_at, updated_at`,
        [
          postData.user_id,
          postData.caption,
          postData.image_url || null,
          postData.status,
          postData.scheduled_at || null,
          postData.instagram_account_id || null
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('投稿作成エラー:', error);
      throw new Error('投稿の作成に失敗しました');
    }
  }

  static async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const result = await database.query(
        `SELECT id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, instagram_post_id, likes_count, comments_count, created_at, updated_at
         FROM posts 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('投稿取得エラー:', error);
      throw new Error('投稿の取得に失敗しました');
    }
  }

  static async updatePost(id: string, updates: PostUpdate): Promise<Post> {
    try {
      const updateFields = [];
      const updateValues = [];
      let valueIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${valueIndex}`);
          updateValues.push(value);
          valueIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('更新データが提供されていません');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const result = await database.query(
        `UPDATE posts SET ${updateFields.join(', ')} 
         WHERE id = $${valueIndex} 
         RETURNING id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, instagram_post_id, likes_count, comments_count, created_at, updated_at`,
        updateValues
      );

      if (result.rows.length === 0) {
        throw new Error('投稿が見つかりません');
      }

      return result.rows[0];
    } catch (error) {
      console.error('投稿更新エラー:', error);
      throw new Error('投稿の更新に失敗しました');
    }
  }

  static async deletePost(id: string): Promise<void> {
    try {
      const result = await database.query(
        'DELETE FROM posts WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('投稿が見つかりません');
      }
    } catch (error) {
      console.error('投稿削除エラー:', error);
      throw new Error('投稿の削除に失敗しました');
    }
  }

  static async getScheduledPosts(userId: string): Promise<Post[]> {
    try {
      const result = await database.query(
        `SELECT id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, instagram_post_id, likes_count, comments_count, created_at, updated_at
         FROM posts 
         WHERE user_id = $1 AND status = 'scheduled' AND scheduled_at > NOW()
         ORDER BY scheduled_at ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('スケジュール投稿取得エラー:', error);
      throw new Error('スケジュール投稿の取得に失敗しました');
    }
  }

  static async publishPost(id: string): Promise<Post> {
    try {
      const result = await database.query(
        `UPDATE posts SET status = 'published', published_at = NOW(), updated_at = NOW() 
         WHERE id = $1 
         RETURNING id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, instagram_post_id, likes_count, comments_count, created_at, updated_at`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('投稿が見つかりません');
      }

      return result.rows[0];
    } catch (error) {
      console.error('投稿公開エラー:', error);
      throw new Error('投稿の公開に失敗しました');
    }
  }

  static async getPostAnalytics(userId: string): Promise<{
    totalPosts: number;
    scheduledPosts: number;
    publishedPosts: number;
    draftPosts: number;
  }> {
    try {
      const result = await database.query(
        `SELECT 
           COUNT(*) as total_posts,
           COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_posts,
           COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
           COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts
         FROM posts 
         WHERE user_id = $1`,
        [userId]
      );

      const row = result.rows[0];
      return {
        totalPosts: parseInt(row.total_posts) || 0,
        scheduledPosts: parseInt(row.scheduled_posts) || 0,
        publishedPosts: parseInt(row.published_posts) || 0,
        draftPosts: parseInt(row.draft_posts) || 0,
      };
    } catch (error) {
      console.error('投稿分析エラー:', error);
      return {
        totalPosts: 0,
        scheduledPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
      };
    }
  }

  // 新しいメソッド: PostIDで投稿取得
  static async getPostById(id: string): Promise<Post | null> {
    try {
      const result = await database.query(
        `SELECT id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, instagram_post_id, likes_count, comments_count, created_at, updated_at
         FROM posts 
         WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('投稿取得エラー:', error);
      return null;
    }
  }

  // 新しいメソッド: ステータス別投稿取得
  static async getPostsByStatus(userId: string, status: string): Promise<Post[]> {
    try {
      const result = await database.query(
        `SELECT id, user_id, instagram_account_id, caption, image_url, status, scheduled_at, published_at, instagram_post_id, likes_count, comments_count, created_at, updated_at
         FROM posts 
         WHERE user_id = $1 AND status = $2 
         ORDER BY created_at DESC`,
        [userId, status]
      );

      return result.rows;
    } catch (error) {
      console.error('ステータス別投稿取得エラー:', error);
      return [];
    }
  }
}

export type { Post, PostInsert, PostUpdate };