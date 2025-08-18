import { NextRequest, NextResponse } from 'next/server';
import { HashtagService } from '../../../../services/hashtagService';
import { verifyAuth } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const categories = await HashtagService.getCategories(String(user.id));

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Hashtag categories GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'カテゴリの取得に失敗しました'
    }, { status: 500 });
  }
}