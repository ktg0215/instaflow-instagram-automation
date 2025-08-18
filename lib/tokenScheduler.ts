// Instagram Token Auto-Refresh Scheduler
export class TokenScheduler {
  private static instance: TokenScheduler;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): TokenScheduler {
    if (!TokenScheduler.instance) {
      TokenScheduler.instance = new TokenScheduler();
    }
    return TokenScheduler.instance;
  }

  // 自動更新を開始（サーバー起動時に呼び出し）
  start() {
    if (this.isRunning) {
      console.log('Token scheduler is already running');
      return;
    }

    console.log('Starting Instagram token auto-refresh scheduler...');
    this.isRunning = true;

    // 毎週実行（7日ごと）- 60日の有効期限に対して十分な余裕
    const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
    
    this.refreshTimer = setInterval(async () => {
      await this.refreshToken();
    }, WEEK_IN_MS);

    // 初回実行（10秒後）
    setTimeout(async () => {
      await this.checkTokenStatus();
    }, 10000);
  }

  // 自動更新を停止
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.isRunning = false;
    console.log('Token scheduler stopped');
  }

  // トークン状態をチェック
  private async checkTokenStatus() {
    try {
      console.log('Checking Instagram token status...');
      
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!accessToken) {
        console.warn('Instagram access token not found');
        return;
      }

      // トークンの有効性をテスト
      const response = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
      );

      if (!response.ok) {
        console.warn(`Instagram token check failed: ${response.status}`);
        // トークンが無効な場合、管理者に通知（実装可能）
        this.notifyTokenIssue(`Token validation failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log(`Instagram token is valid for user: ${data.username} (${data.id})`);

      // トークンタイプの確認
      const tokenType = accessToken.startsWith('IGAAR') ? 'Short-lived' : 'Long-lived';
      console.log(`Token type: ${tokenType}`);

      if (tokenType === 'Short-lived') {
        console.log('Short-lived token detected, attempting to exchange for long-lived token...');
        await this.refreshToken();
      }

    } catch (error) {
      console.error('Token status check failed:', error);
      this.notifyTokenIssue(`Token check error: ${error}`);
    }
  }

  // トークンを更新
  private async refreshToken() {
    try {
      console.log('Attempting to refresh Instagram token...');

      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      const appSecret = process.env.INSTAGRAM_APP_SECRET;

      if (!accessToken || !appSecret) {
        console.error('Missing required environment variables for token refresh');
        return;
      }

      // 短期トークンの場合は長期トークンに変換
      let refreshUrl: string;
      if (accessToken.startsWith('IGAAR')) {
        // 短期トークン → 長期トークン変換
        refreshUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${accessToken}`;
      } else {
        // 長期トークンの更新
        refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`;
      }

      const response = await fetch(refreshUrl);
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Token refresh successful!');
      console.log(`New token expires in: ${data.expires_in} seconds (${Math.floor(data.expires_in / (24 * 60 * 60))} days)`);
      
      // 新しいトークンをログに記録（実際の運用では環境変数を動的に更新する必要がある）
      console.log('New token (update your .env.local):');
      console.log(`INSTAGRAM_ACCESS_TOKEN=${data.access_token}`);
      
      // 通知（実装可能）
      this.notifyTokenRefresh(data.access_token, data.expires_in);

    } catch (error) {
      console.error('Token refresh failed:', error);
      this.notifyTokenIssue(`Token refresh error: ${error}`);
    }
  }

  // トークン更新の通知（実装例）
  private notifyTokenRefresh(newToken: string, expiresIn: number) {
    // 実際の実装では以下のような通知方法が考えられます：
    // 1. データベースに保存
    // 2. 管理者にメール送信
    // 3. Slack通知
    // 4. ログファイルに記録
    
    console.log('=== TOKEN REFRESH NOTIFICATION ===');
    console.log('Instagram token has been refreshed successfully');
    console.log(`Expires in: ${Math.floor(expiresIn / (24 * 60 * 60))} days`);
    console.log('Please update your .env.local file with the new token');
    console.log('===================================');
  }

  // トークン問題の通知
  private notifyTokenIssue(message: string) {
    console.error('=== TOKEN ISSUE NOTIFICATION ===');
    console.error('Instagram token issue detected:');
    console.error(message);
    console.error('Please check your Instagram app configuration');
    console.error('================================');
  }

  // 手動でトークン更新を実行
  async manualRefresh(): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      await this.refreshToken();
      return {
        success: true,
        message: 'トークンの更新に成功しました'
      };
    } catch (error) {
      return {
        success: false,
        message: `トークンの更新に失敗しました: ${error}`
      };
    }
  }

  // スケジューラーの状態を取得
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasTimer: this.refreshTimer !== null
    };
  }
}

// サーバー起動時の初期化（Next.jsの場合、このファイルを直接使用）
export const initializeTokenScheduler = () => {
  if (process.env.NODE_ENV !== 'development') {
    const scheduler = TokenScheduler.getInstance();
    scheduler.start();
  }
};