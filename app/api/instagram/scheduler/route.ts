import { NextRequest, NextResponse } from 'next/server';
import { TokenScheduler } from '../../../../lib/tokenScheduler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const scheduler = TokenScheduler.getInstance();

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          scheduler: scheduler.getStatus()
        });

      case 'start':
        scheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Token scheduler started'
        });

      case 'stop':
        scheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Token scheduler stopped'
        });

      case 'refresh':
        const result = await scheduler.manualRefresh();
        return NextResponse.json(result);

      default:
        return NextResponse.json({
          success: true,
          message: 'Instagram Token Scheduler API',
          availableActions: ['status', 'start', 'stop', 'refresh']
        });
    }
  } catch (error) {
    console.error('Scheduler API error:', error);
    return NextResponse.json({
      success: false,
      error: 'スケジューラーAPIでエラーが発生しました'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    error: 'POST method not supported. Use GET with action parameter.'
  }, { status: 405 });
}