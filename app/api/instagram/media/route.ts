import { NextResponse } from 'next/server';

// モックのInstagramメディアデータ
const mockMedia = [
  {
    id: '17895695668004550',
    media_type: 'IMAGE' as const,
    media_url: 'https://images.pexels.com/photos/1631677/pexels-photo-1631677.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: '今日のコーヒータイム☕️ 新しいカフェを発見しました！ #coffee #cafe #morning #goodvibes #lifestyle',
    timestamp: '2025-08-07T10:30:00+0000',
    like_count: 89,
    comments_count: 12,
    permalink: 'https://www.instagram.com/p/ABC123/',
  },
  {
    id: '17895695668004551',
    media_type: 'IMAGE' as const,
    media_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: '夕日が美しい🌅 今日も一日お疲れさまでした！ #sunset #beautiful #nature #photography #peaceful',
    timestamp: '2025-08-06T18:45:00+0000',
    like_count: 156,
    comments_count: 23,
    permalink: 'https://www.instagram.com/p/ABC124/',
  },
  {
    id: '17895695668004552',
    media_type: 'IMAGE' as const,
    media_url: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'おいしいランチをいただきました🍽️ シェフの心のこもった料理に感動！ #lunch #foodie #delicious #restaurant #grateful',
    timestamp: '2025-08-05T12:15:00+0000',
    like_count: 203,
    comments_count: 34,
    permalink: 'https://www.instagram.com/p/ABC125/',
  },
  {
    id: '17895695668004553',
    media_type: 'IMAGE' as const,
    media_url: 'https://images.pexels.com/photos/1526814/pexels-photo-1526814.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'ワークスペースを整理しました💻 効率的な環境で作業がはかどります！ #workspace #productivity #organized #workfromhome #motivation',
    timestamp: '2025-08-04T09:00:00+0000',
    like_count: 127,
    comments_count: 18,
    permalink: 'https://www.instagram.com/p/ABC126/',
  },
  {
    id: '17895695668004554',
    media_type: 'VIDEO' as const,
    media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    caption: '朝のヨガルーティン🧘‍♀️ 心と体のバランスを整えて一日をスタート！ #yoga #morning #wellness #selfcare #mindfulness',
    timestamp: '2025-08-03T07:30:00+0000',
    like_count: 234,
    comments_count: 45,
    permalink: 'https://www.instagram.com/p/ABC127/',
  }
];

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');

    // Instagram Graph API からメディア情報を取得
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&limit=${limit}&access_token=${accessToken}`,
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

    return NextResponse.json({
      success: true,
      data: data.data || [],
      paging: data.paging || null
    });
  } catch (error) {
    console.error('Instagram media API error:', error);
    
    // エラー時にはモックデータを返す（フォールバック）
    const limitedMedia = mockMedia.slice(0, Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '25'), mockMedia.length));
    
    return NextResponse.json({
      success: true,
      data: limitedMedia,
      paging: {
        cursors: {
          before: 'before_cursor',
          after: 'after_cursor'
        },
        next: limitedMedia.length === mockMedia.length ? undefined : 'https://graph.instagram.com/me/media?after=after_cursor'
      },
      note: 'API エラーのためフォールバックデータを使用'
    });
  }
}