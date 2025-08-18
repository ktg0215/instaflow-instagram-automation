// エラーハンドリングの標準化

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export class AppErrorHandler {
  private static instance: AppErrorHandler;
  private errors: AppError[] = [];

  private constructor() {}

  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  // エラーのログ記録
  logError(error: Error | AppError | unknown, context?: string): AppError {
    let appError: AppError;

    if (error instanceof Error) {
      appError = {
        code: error.name || 'UnknownError',
        message: error.message,
        details: { stack: error.stack, context },
        timestamp: new Date(),
      };
    } else if (this.isAppError(error)) {
      appError = error;
    } else {
      appError = {
        code: 'UnknownError',
        message: String(error),
        details: { context },
        timestamp: new Date(),
      };
    }

    this.errors.push(appError);
    
    // 開発環境でのみコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.error('AppError:', appError);
    }

    return appError;
  }

  // ユーザーフレンドリーなエラーメッセージの生成
  getUserMessage(error: Error | AppError | unknown): string {
    if (error instanceof Error) {
      return this.getMessageForErrorType(error.message, error.name);
    }
    
    if (this.isAppError(error)) {
      return this.getMessageForErrorCode(error.code);
    }

    return 'エラーが発生しました。しばらく時間をおいてから再度お試しください。';
  }

  private isAppError(error: unknown): error is AppError {
    return error !== null && 
           typeof error === 'object' && 
           'code' in error && 
           'message' in error &&
           typeof (error as AppError).code === 'string' && 
           typeof (error as AppError).message === 'string';
  }

  private getMessageForErrorType(message: string, _name: string): string {
    // ネットワークエラー
    if (message.includes('Failed to fetch') || message.includes('Network Error')) {
      return 'インターネット接続を確認してください。';
    }

    // 認証エラー
    if (message.includes('Unauthorized') || message.includes('401')) {
      return 'ログインが必要です。再度ログインしてください。';
    }

    // 権限エラー
    if (message.includes('Forbidden') || message.includes('403')) {
      return 'この操作を実行する権限がありません。';
    }

    // サーバーエラー
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'サーバーでエラーが発生しました。しばらく時間をおいてから再度お試しください。';
    }

    // バリデーションエラー
    if (message.includes('validation') || message.includes('invalid')) {
      return '入力内容に誤りがあります。内容を確認してください。';
    }

    return message || 'エラーが発生しました。';
  }

  private getMessageForErrorCode(code: string): string {
    const errorMessages: Record<string, string> = {
      'AUTH_FAILED': 'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
      'INSTAGRAM_CONNECTION_FAILED': 'Instagramとの接続に失敗しました。',
      'POST_CREATE_FAILED': '投稿の作成に失敗しました。',
      'POST_UPDATE_FAILED': '投稿の更新に失敗しました。',
      'POST_DELETE_FAILED': '投稿の削除に失敗しました。',
      'AI_GENERATION_FAILED': 'AI生成に失敗しました。しばらく時間をおいてから再度お試しください。',
      'DATABASE_ERROR': 'データベースエラーが発生しました。',
      'VALIDATION_ERROR': '入力内容に誤りがあります。',
      'NETWORK_ERROR': 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    };

    return errorMessages[code] || 'エラーが発生しました。';
  }

  // エラー履歴の取得
  getErrorHistory(limit = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  // エラー履歴のクリア
  clearErrorHistory(): void {
    this.errors = [];
  }
}

// グローバルなエラーハンドラー
export const errorHandler = AppErrorHandler.getInstance();

// React Query用エラーハンドラー
export const handleQueryError = (error: unknown, context?: string): string => {
  const appError = errorHandler.logError(error, context);
  return errorHandler.getUserMessage(appError);
};

// Fetch API用エラーハンドラー
export const handleFetchError = async (response: Response, context?: string): Promise<never> => {
  let errorMessage: string;
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status} ${response.statusText}`;
  }

  const error = new Error(errorMessage);
  error.name = `HTTP${response.status}`;
  
  throw errorHandler.logError(error, context);
};

// 非同期関数のラッパー
export const withErrorHandler = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw errorHandler.logError(error, context);
    }
  };
};