import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Instagram access token が設定されていません' 
        },
        { status: 500 }
      );
    }

    // Instagram Graph API からプロフィール情報を取得
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();

    // Instagram Graph API のレスポンスから必要な形式に変換
    const profile = {
      id: data.id,
      username: data.username,
      name: data.username, // Graph API では name フィールドが利用できない場合がある
      biography: '', // Basic Display API では取得可能だが Graph API では制限あり
      followers_count: 0, // Business API でのみ取得可能
      follows_count: 0, // Business API でのみ取得可能
      media_count: data.media_count || 0,
      profile_picture_url: '', // 別途取得が必要
      website: '',
      account_type: data.account_type || 'PERSONAL',
      is_verified: false,
    };

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Instagram profile API error:', error);
    
    // エラー時にはモックデータを返す（フォールバック）
    const fallbackProfile = {
      id: '9511482895619368',
      username: 'shota0215k',
      name: 'shota0215k',
      biography: 'Instagram Business Account',
      followers_count: 0,
      follows_count: 0,
      media_count: 1,
      profile_picture_url: '',
      website: '',
      account_type: 'BUSINESS' as const,
      is_verified: false,
    };
    
    return NextResponse.json({
      success: true,
      profile: fallbackProfile,
      note: 'API エラーのためフォールバックデータを使用'
    });
  }
}