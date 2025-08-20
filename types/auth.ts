// アプリケーション全体で使用する統一された認証関連の型定義

export interface User {
  id: string | number; // Support both UUID and number for compatibility
  email: string;
  name?: string;
  password?: string; // Optional for external providers
  role: string; // Required for admin checks
  google_id?: string;
  profile_picture_url?: string;
  created_at: Date | string;
  updated_at?: Date | string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
}

// Google OAuth関連
export interface GoogleAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// API設定関連
export interface ApiSettings {
  openai_api_key: string | null;
  instagram_client_id: string | null;
  instagram_client_secret: string | null;
}