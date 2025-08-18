import { NextRequest, NextResponse } from 'next/server';
import { AIService, AIGenerationRequest } from '../../../../services/aiService';

export async function POST(request: NextRequest) {
  try {
    const body: AIGenerationRequest = await request.json();
    
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'プロンプトが必要です' },
        { status: 400 }
      );
    }

    let result;
    
    if (body.type === 'text' || !body.type) {
      result = await AIService.generateText(body.prompt, body.options);
    } else if (body.type === 'image') {
      result = await AIService.generateImage(body.prompt, body.options);
    } else {
      return NextResponse.json(
        { error: '無効なリクエストタイプです' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI生成APIエンドポイント',
    endpoints: {
      POST: '/api/ai/generate - AI文章・画像生成'
    },
    supportedTypes: ['text', 'image'],
    textOptions: ['tone', 'length'],
    imageOptions: ['style', 'aspectRatio']
  });
}