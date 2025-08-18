import axios from 'axios';

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  followers_count?: number;
  profile_picture_url?: string;
  name?: string;
}

export interface InstagramPostData {
  image_url?: string;
  video_url?: string;
  caption: string;
  access_token: string;
}

export class InstagramService {
  private static readonly BASE_URL = 'https://graph.facebook.com/v23.0';
  
  // Get access token from environment or localStorage
  private static getAccessToken(): string | null {
    // Server-side: use environment variable
    if (typeof window === 'undefined') {
      // サーバー側でも NEXT_PUBLIC_ をフォールバックとして参照
      return (
        process.env.INSTAGRAM_ACCESS_TOKEN ||
        process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN ||
        null
      );
    }
    // Client-side: use localStorage first, then environment variable as fallback
    return localStorage.getItem('INSTAGRAM_ACCESS_TOKEN') || process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN || null;
  }

  // Check if access token is properly configured
  private static isTokenValid(): boolean {
    const token = this.getAccessToken();
    return !!(token && token.length > 50);
  }


  // ユーザープロフィール情報を取得（モック実装）
  static async getUserProfile(): Promise<InstagramProfile> {
    // Phase 5: モックAPIエンドポイントを使用
    try {
      const response = await fetch('/api/instagram/profile');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'プロフィール取得に失敗しました');
      }
      
      return data.profile;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('プロフィール取得に失敗しました');
    }
  }

  // ユーザーのメディア一覧を取得（モック実装）
  static async getUserMedia(limit: number = 25): Promise<InstagramMedia[]> {
    // Phase 5: モックAPIエンドポイントを使用
    try {
      const response = await fetch(`/api/instagram/media?limit=${limit}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'メディア取得に失敗しました');
      }
      
      return data.data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('メディア取得に失敗しました');
    }
  }

  // 画像投稿を作成（2段階プロセス）
  static async createImagePost(postData: InstagramPostData): Promise<string> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Instagram access token is not configured');
    }

    try {
      const profile = await this.getUserProfile();
      
      // Step 1: メディアコンテナを作成
      const containerResponse = await axios.post(`${this.BASE_URL}/${profile.id}/media`, {
        image_url: postData.image_url,
        caption: postData.caption,
        access_token: accessToken
      });

      const containerId = containerResponse.data.id;

      // Step 2: メディアを公開
      const publishResponse = await axios.post(`${this.BASE_URL}/${profile.id}/media_publish`, {
        creation_id: containerId,
        access_token: accessToken
      });

      return publishResponse.data.id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.error;
        if (errorData?.code === 190) {
          throw new Error('Instagram access token is invalid or expired');
        }
        const errorMessage = errorData?.message || error.message;
        throw new Error(`Instagram投稿の作成に失敗しました: ${errorMessage}`);
      }
      throw new Error('Instagram投稿の作成に失敗しました');
    }
  }

  // 動画投稿を作成（2段階プロセス）
  static async createVideoPost(postData: InstagramPostData): Promise<string> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Instagram access token is not configured');
    }

    try {
      const profile = await this.getUserProfile();
      
      // Step 1: メディアコンテナを作成
      const containerResponse = await axios.post(`${this.BASE_URL}/${profile.id}/media`, {
        video_url: postData.video_url,
        caption: postData.caption,
        media_type: 'VIDEO',
        access_token: accessToken
      });

      const containerId = containerResponse.data.id;

      // Step 2: 動画処理の完了を待つ
      await this.waitForVideoProcessing(containerId, accessToken);

      // Step 3: メディアを公開
      const publishResponse = await axios.post(`${this.BASE_URL}/${profile.id}/media_publish`, {
        creation_id: containerId,
        access_token: accessToken
      });

      return publishResponse.data.id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.error;
        if (errorData?.code === 190) {
          throw new Error('Instagram access token is invalid or expired');
        }
        const errorMessage = errorData?.message || error.message;
        throw new Error(`Instagram動画投稿の作成に失敗しました: ${errorMessage}`);
      }
      throw new Error('Instagram動画投稿の作成に失敗しました');
    }
  }

  // 動画処理の完了を待つ
  private static async waitForVideoProcessing(containerId: string, accessToken: string): Promise<void> {
    const maxAttempts = 30; // 最大30回試行（約5分）
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${this.BASE_URL}/${containerId}`, {
          params: {
            fields: 'status_code',
            access_token: accessToken
          }
        });

        const statusCode = response.data.status_code;
        
        if (statusCode === 'FINISHED') {
          return; // 処理完了
        } else if (statusCode === 'ERROR') {
          throw new Error('動画処理中にエラーが発生しました');
        }

        // 10秒待機
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      } catch (error) {
        throw error;
      }
    }

    throw new Error('動画処理がタイムアウトしました');
  }

  // メディアの詳細情報を取得
  static async getMediaDetails(mediaId: string): Promise<InstagramMedia> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Instagram access token is not configured');
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/${mediaId}`, {
        params: {
          fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      throw new Error('Instagramメディア詳細の取得に失敗しました');
    }
  }

  // アクセストークンの有効性を確認
  static async validateAccessToken(): Promise<boolean> {
    try {
      if (!this.isTokenValid()) {
        return false;
      }
      await this.getUserProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  // インサイトデータを取得（ビジネスアカウントのみ）
  static async getMediaInsights(mediaId: string): Promise<any> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return [];
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/${mediaId}/insights`, {
        params: {
          metric: 'impressions,reach,likes,comments,saves,shares',
          access_token: accessToken
        }
      });

      return response.data.data;
    } catch (error) {
      // インサイトが取得できない場合は空のデータを返す
      return [];
    }
  }

  // ハッシュタグ検索
  static async searchHashtags(query: string): Promise<any[]> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return [];
    }

    try {
      const profile = await this.getUserProfile();
      
      const response = await axios.get(`${this.BASE_URL}/ig_hashtag_search`, {
        params: {
          user_id: profile.id,
          q: query,
          access_token: accessToken
        }
      });

      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // デバッグ用: 接続テスト
  static async testConnection(): Promise<{
    tokenValid: boolean;
    pagesFound: number;
    instagramConnected: boolean;
    profile?: InstagramProfile;
    error?: string;
  }> {
    const accessToken = this.getAccessToken();
    
    try {
      if (!accessToken) {
        return {
          tokenValid: false,
          pagesFound: 0,
          instagramConnected: false,
          error: 'Access token not configured'
        };
      }

      const tokenTestUrl = `${this.BASE_URL}/me?access_token=${accessToken}`;
      await axios.get(tokenTestUrl);
      
      const apiUrl = `${this.BASE_URL}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`;
      const pagesResponse = await axios.get(apiUrl);

      const pages = pagesResponse.data.data || [];
      const instagramPages = pages.filter((p: any) => p.instagram_business_account);

      if (instagramPages.length === 0) {
        return {
          tokenValid: true,
          pagesFound: pages.length,
          instagramConnected: false,
          error: 'No Instagram business accounts found'
        };
      }

      const profile = await this.getUserProfile();

      return {
        tokenValid: true,
        pagesFound: pages.length,
        instagramConnected: true,
        profile
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.error;
        if (errorData) {
          errorMessage = `${errorData.type}: ${errorData.message} (Code: ${errorData.code})`;
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        tokenValid: false,
        pagesFound: 0,
        instagramConnected: false,
        error: errorMessage
      };
    }
  }
}