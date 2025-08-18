import 'server-only'

import { database } from '../lib/database';

export interface Hashtag {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface HashtagInsert {
  user_id: string;
  name: string;
  category?: string;
}

export interface HashtagUpdate {
  name?: string;
  category?: string;
}

export class HashtagService {
  // ユーザーのハッシュタグ一覧を取得
  static async getHashtagsByUserId(userId: string): Promise<Hashtag[]> {
    try {
      const result = await database.query(
        `SELECT id, user_id, name, category, usage_count, created_at, updated_at 
         FROM hashtags 
         WHERE user_id = $1 
         ORDER BY usage_count DESC, name ASC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('ハッシュタグ取得エラー:', error);
      throw new Error('ハッシュタグの取得に失敗しました');
    }
  }

  // カテゴリ別ハッシュタグ取得
  static async getHashtagsByCategory(userId: string, category: string): Promise<Hashtag[]> {
    try {
      const result = await database.query(
        `SELECT id, user_id, name, category, usage_count, created_at, updated_at 
         FROM hashtags 
         WHERE user_id = $1 AND category = $2 
         ORDER BY usage_count DESC, name ASC`,
        [userId, category]
      );
      return result.rows;
    } catch (error) {
      console.error('カテゴリ別ハッシュタグ取得エラー:', error);
      throw new Error('カテゴリ別ハッシュタグの取得に失敗しました');
    }
  }

  // ハッシュタグ検索
  static async searchHashtags(userId: string, query: string): Promise<Hashtag[]> {
    try {
      const result = await database.query(
        `SELECT id, user_id, name, category, usage_count, created_at, updated_at 
         FROM hashtags 
         WHERE user_id = $1 AND name ILIKE $2 
         ORDER BY usage_count DESC, name ASC`,
        [userId, `%${query}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('ハッシュタグ検索エラー:', error);
      throw new Error('ハッシュタグの検索に失敗しました');
    }
  }

  // ハッシュタグ作成
  static async createHashtag(hashtagData: HashtagInsert): Promise<Hashtag> {
    try {
      // 名前を正規化（#を除去し、小文字に変換）
      const normalizedName = hashtagData.name.replace(/^#/, '').toLowerCase().trim();
      
      if (!normalizedName) {
        throw new Error('有効なハッシュタグ名を入力してください');
      }

      const result = await database.query(
        `INSERT INTO hashtags (user_id, name, category, usage_count, created_at, updated_at) 
         VALUES ($1, $2, $3, 0, NOW(), NOW()) 
         ON CONFLICT (user_id, name) DO UPDATE SET
         category = EXCLUDED.category,
         updated_at = NOW()
         RETURNING id, user_id, name, category, usage_count, created_at, updated_at`,
        [hashtagData.user_id, normalizedName, hashtagData.category || null]
      );
      
      return result.rows[0];
    } catch (error: any) {
      console.error('ハッシュタグ作成エラー:', error);
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('このハッシュタグは既に存在しています');
      }
      throw new Error('ハッシュタグの作成に失敗しました');
    }
  }

  // ハッシュタグ更新
  static async updateHashtag(id: string, userId: string, updateData: HashtagUpdate): Promise<Hashtag> {
    try {
      const setParts = [];
      const values = [];
      let paramIndex = 1;

      if (updateData.name !== undefined) {
        const normalizedName = updateData.name.replace(/^#/, '').toLowerCase().trim();
        if (!normalizedName) {
          throw new Error('有効なハッシュタグ名を入力してください');
        }
        setParts.push(`name = $${paramIndex}`);
        values.push(normalizedName);
        paramIndex++;
      }

      if (updateData.category !== undefined) {
        setParts.push(`category = $${paramIndex}`);
        values.push(updateData.category || null);
        paramIndex++;
      }

      if (setParts.length === 0) {
        throw new Error('更新するデータがありません');
      }

      setParts.push(`updated_at = NOW()`);
      values.push(id, userId);

      const result = await database.query(
        `UPDATE hashtags 
         SET ${setParts.join(', ')} 
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} 
         RETURNING id, user_id, name, category, usage_count, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('ハッシュタグが見つかりません');
      }

      return result.rows[0];
    } catch (error: any) {
      console.error('ハッシュタグ更新エラー:', error);
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('このハッシュタグ名は既に使用されています');
      }
      throw new Error('ハッシュタグの更新に失敗しました');
    }
  }

  // ハッシュタグ削除
  static async deleteHashtag(id: string, userId: string): Promise<boolean> {
    try {
      const result = await database.query(
        'DELETE FROM hashtags WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('ハッシュタグ削除エラー:', error);
      throw new Error('ハッシュタグの削除に失敗しました');
    }
  }

  // 使用回数を増加
  static async incrementUsageCount(id: string, userId: string): Promise<void> {
    try {
      await database.query(
        `UPDATE hashtags 
         SET usage_count = usage_count + 1, updated_at = NOW() 
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
    } catch (error) {
      console.error('使用回数更新エラー:', error);
      // エラーでも処理を継続（使用回数の更新は重要でない）
    }
  }

  // 複数のハッシュタグ使用回数を増加
  static async incrementMultipleUsageCounts(hashtagIds: string[], userId: string): Promise<void> {
    try {
      if (hashtagIds.length === 0) return;

      await database.query(
        `UPDATE hashtags 
         SET usage_count = usage_count + 1, updated_at = NOW() 
         WHERE id = ANY($1) AND user_id = $2`,
        [hashtagIds, userId]
      );
    } catch (error) {
      console.error('複数使用回数更新エラー:', error);
      // エラーでも処理を継続
    }
  }

  // カテゴリ一覧を取得
  static async getCategories(userId: string): Promise<string[]> {
    try {
      const result = await database.query(
        `SELECT DISTINCT category 
         FROM hashtags 
         WHERE user_id = $1 AND category IS NOT NULL 
         ORDER BY category ASC`,
        [userId]
      );
      
      return result.rows.map(row => row.category);
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      throw new Error('カテゴリの取得に失敗しました');
    }
  }

  // 人気ハッシュタグ（使用回数上位）を取得
  static async getPopularHashtags(userId: string, limit: number = 20): Promise<Hashtag[]> {
    try {
      const result = await database.query(
        `SELECT id, user_id, name, category, usage_count, created_at, updated_at 
         FROM hashtags 
         WHERE user_id = $1 
         ORDER BY usage_count DESC, created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('人気ハッシュタグ取得エラー:', error);
      throw new Error('人気ハッシュタグの取得に失敗しました');
    }
  }
}