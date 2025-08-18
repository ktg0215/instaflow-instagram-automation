import { NextRequest, NextResponse } from 'next/server';

// Instagram Token Management API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'info') {
      return await getTokenInfo();
    } else if (action === 'exchange') {
      return await exchangeForLongLivedToken();
    } else if (action === 'refresh') {
      return await refreshLongLivedToken();
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use: info, exchange, or refresh'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Token management error:', error);
    return NextResponse.json({
      success: false,
      error: 'トークン管理でエラーが発生しました'
    }, { status: 500 });
  }
}

// 現在のトークン情報を取得
async function getTokenInfo() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  
  if (!accessToken) {
    return NextResponse.json({
      success: false,
      error: 'アクセストークンが設定されていません'
    }, { status: 400 });
  }

  try {
    // トークンの詳細情報を取得
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      tokenInfo: {
        userId: data.id,
        username: data.username,
        accountType: data.account_type,
        tokenType: accessToken.startsWith('IGAAR') ? 'Short-lived' : 'Long-lived',
        tokenPrefix: accessToken.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'トークン情報の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 短期トークンを長期トークンに変換
async function exchangeForLongLivedToken() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!accessToken || !appSecret) {
    return NextResponse.json({
      success: false,
      error: 'アクセストークンまたはApp Secretが設定されていません'
    }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      longLivedToken: data.access_token,
      expiresIn: data.expires_in, // 秒数（通常5184000秒 = 60日）
      tokenType: data.token_type,
      message: '長期トークンの取得に成功しました。この新しいトークンを.env.localに設定してください。'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '長期トークンの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 長期トークンを更新
async function refreshLongLivedToken() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({
      success: false,
      error: 'アクセストークンが設定されていません'
    }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      newToken: data.access_token,
      expiresIn: data.expires_in, // 新しい有効期限（通常60日延長）
      tokenType: data.token_type,
      message: 'トークンの更新に成功しました。この新しいトークンを.env.localに設定してください。'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'トークンの更新に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    error: 'POST method not supported. Use GET with action parameter.'
  }, { status: 405 });
}