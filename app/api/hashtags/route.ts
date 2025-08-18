import { NextRequest, NextResponse } from 'next/server';
import { HashtagService } from '../../../services/hashtagService';
import { verifyAuth } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular');

    let hashtags;

    if (search) {
      hashtags = await HashtagService.searchHashtags(String(user.id), search);
    } else if (category) {
      hashtags = await HashtagService.getHashtagsByCategory(String(user.id), category);
    } else if (popular) {
      const limit = parseInt(popular) || 20;
      hashtags = await HashtagService.getPopularHashtags(String(user.id), limit);
    } else {
      hashtags = await HashtagService.getHashtagsByUserId(String(user.id));
    }

    return NextResponse.json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    console.error('Hashtag GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'ハッシュタグの取得に失敗しました'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({
        success: false,
        error: 'ハッシュタグ名は必須です'
      }, { status: 400 });
    }

    const hashtag = await HashtagService.createHashtag({
      user_id: String(user.id),
      name: name.trim(),
      category: category?.trim() || undefined
    });

    return NextResponse.json({
      success: true,
      data: hashtag,
      message: 'ハッシュタグが作成されました'
    });
  } catch (error) {
    console.error('Hashtag POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'ハッシュタグの作成に失敗しました'
    }, { status: 500 });
  }
}