import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('📊 Performance Analytics Received:', {
      sessionId: data.sessionId,
      metricsCount: data.metrics?.length || 0
    })
    
    return NextResponse.json({
      received: true,
      sessionId: data.sessionId,
      timestamp: new Date().toISOString()
    }, { status: 200 })
    
  } catch (error) {
    console.error('Analytics processing error:', error)
    return NextResponse.json({
      error: 'Failed to process analytics data'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Performance analytics endpoint',
    method: 'POST'
  })
}
