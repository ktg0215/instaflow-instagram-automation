import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Dynamic import to prevent client-side bundling
    const { default: database } = await import('@/lib/database')
    
    // Database health check - use the new healthCheck method
    const healthResult = await database.healthCheck();
    
    return NextResponse.json({
      ...healthResult,
      status: 'Database health check completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database health check error:', error);
    
    return NextResponse.json(
      { 
        ok: false, 
        status: 'Database health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        database: 'error'
      }, 
      { status: 500 }
    );
  }
}