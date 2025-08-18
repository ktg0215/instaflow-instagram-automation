import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    // JWT認証チェック
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '認証トークンが必要です' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'development-secret';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // モック実装：実際のAPIでは以下の処理が必要
    // 1. データベースからユーザーのInstagram接続情報を削除
    // 2. Instagram APIでアクセストークンを無効化
    // 3. 関連するキャッシュを削除

    // リアルなAPI遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log(`Instagram disconnection for user ${decoded.userId} (mock)`);

    return NextResponse.json({
      success: true,
      message: 'Instagramアカウントの連携を解除しました',
    });
  } catch (error) {
    console.error('Instagram disconnect mock error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '連携解除に失敗しました' 
      },
      { status: 500 }
    );
  }
}