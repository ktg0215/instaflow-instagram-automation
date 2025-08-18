import { NextRequest, NextResponse } from 'next/server';
import { HashtagService } from '../../../../services/hashtagService';
import { verifyAuth } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 単一ハッシュタグの詳細取得は現在のサービスでは不要
    // 必要に応じて実装
    return NextResponse.json({
      success: false,
      error: '単一ハッシュタグの取得は現在サポートされていません'
    }, { status: 404 });
  } catch (error) {
    console.error('Hashtag GET by ID error:', error);
    return NextResponse.json({
      success: false,
      error: 'ハッシュタグの取得に失敗しました'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: '更新するデータがありません'
      }, { status: 400 });
    }

    const params = await context.params;
    const hashtag = await HashtagService.updateHashtag(params.id, String(user.id), updateData);

    return NextResponse.json({
      success: true,
      data: hashtag,
      message: 'ハッシュタグが更新されました'
    });
  } catch (error) {
    console.error('Hashtag PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'ハッシュタグの更新に失敗しました'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const params = await context.params;
    const deleted = await HashtagService.deleteHashtag(params.id, String(user.id));
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'ハッシュタグが見つかりません'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'ハッシュタグが削除されました'
    });
  } catch (error) {
    console.error('Hashtag DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'ハッシュタグの削除に失敗しました'
    }, { status: 500 });
  }
}