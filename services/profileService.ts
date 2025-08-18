// 一時的にSupabase関連機能を無効化
// NOTE: Supabase は未使用
// import { Database } from '../types/database';

// type Profile = Database['public']['Tables']['profiles']['Row'];
// type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
// type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

interface ProfileInsert {
  user_id: string;
  email: string;
  full_name: string;
  timezone: string;
  language: string;
}

interface ProfileUpdate {
  full_name?: string;
  timezone?: string;
  language?: string;
}

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    // TODO: PostgreSQL実装に変更
    return null;
  }

  static async cleanupDuplicateProfiles(userId: string): Promise<void> {
    // TODO: PostgreSQL実装に変更
  }

  static async createProfile(profileData: ProfileInsert): Promise<Profile> {
    // TODO: PostgreSQL実装に変更
    throw new Error('プロフィール機能は現在開発中です');
  }

  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    // TODO: PostgreSQL実装に変更
    throw new Error('プロフィール更新機能は現在開発中です');
  }

  static async getOrCreateProfile(userId: string, email: string): Promise<Profile> {
    // TODO: PostgreSQL実装に変更
    throw new Error('プロフィール機能は現在開発中です');
  }
}