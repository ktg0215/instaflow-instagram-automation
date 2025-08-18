'use client'

// 一時的にSupabase関連機能を無効化
// import { User } from '@supabase/supabase-js'

// モックUserタイプを定義
interface User {
  id: string;
  email?: string;
  aud: string;
  role: string;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  identities?: any[];
}

// 開発環境用のモックユーザー
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: []
}

// 開発環境用のモック認証サービス
export class MockAuthService {
  public static currentUser: User | null = null
  private static listeners: Array<(user: User | null) => void> = []

  static getCurrentUser(): User | null {
    return this.currentUser
  }

  static async signIn(email: string, password: string): Promise<{ user: User | null, error: any }> {
    console.log('Mock SignIn:', email, password)
    
    // 簡単な検証
    if (email === 'test@example.com' && password === 'password123') {
      this.currentUser = { ...mockUser, email }
      this.notifyListeners()
      return { user: this.currentUser, error: null }
    }
    
    return { 
      user: null, 
      error: { message: 'Invalid credentials' }
    }
  }

  static async signUp(email: string, password: string): Promise<{ user: User | null, error: any }> {
    console.log('Mock SignUp:', email, password)
    
    // 開発環境では常に成功
    this.currentUser = { ...mockUser, email }
    this.notifyListeners()
    return { user: this.currentUser, error: null }
  }

  static async signOut(): Promise<void> {
    console.log('Mock SignOut')
    this.currentUser = null
    this.notifyListeners()
  }

  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback)
    
    // 初回コールバック
    setTimeout(() => callback(this.currentUser), 0)
    
    // アンサブスクライブ関数を返す
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private static notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser))
  }
}

// ローカルストレージへの状態保存/復元
if (typeof window !== 'undefined') {
  // ページロード時に状態を復元
  const savedUser = localStorage.getItem('mockUser')
  if (savedUser) {
    try {
      MockAuthService['currentUser'] = JSON.parse(savedUser)
    } catch (e) {
      console.warn('Failed to restore mock user from localStorage')
    }
  }

  // 状態変更時にローカルストレージに保存
  const originalNotifyListeners = MockAuthService['notifyListeners']
  MockAuthService['notifyListeners'] = function() {
    if (MockAuthService.currentUser) {
      localStorage.setItem('mockUser', JSON.stringify(MockAuthService.currentUser))
    } else {
      localStorage.removeItem('mockUser')
    }
    originalNotifyListeners.call(this)
  }
}