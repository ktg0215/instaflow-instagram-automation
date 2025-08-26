import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // モック実装：実際のAPIでは以下の処理が必要
    // 1. データベースからユーザーのInstagram接続情報を削除
    // 2. Instagram APIでアクセストークンを無効化
    // 3. 関連するキャッシュを削除

    // リアルなAPI遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log(`Instagram disconnection for user ${userId} (mock)`);

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