import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to prevent client-side bundling
    const { healthCheck } = await import('@/lib/supabase')
    
    // Supabase health check using the client
    const healthResult = await healthCheck();
    
    return NextResponse.json({
      ...healthResult,
      status: 'Supabase health check completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Supabase health check error:', error);
    
    return NextResponse.json(
      { 
        ok: false, 
        status: 'Supabase health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        database: 'error'
      }, 
      { status: 500 }
    );
  }
}