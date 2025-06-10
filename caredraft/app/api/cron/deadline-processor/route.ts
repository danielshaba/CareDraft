import { NextRequest, NextResponse } from 'next/server'
import { proposalDeadlineManager, DeadlineProcessingResult } from '@/lib/services/proposal-deadline-manager'

// This route handles automated proposal deadline processing
// It can be called by cron jobs, webhooks, or scheduling services like Vercel Cron

export async function GET(request: NextRequest) {
  try {
    
    // Verify the request is authorized (for security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting automated deadline processing...')
    
    // Process all proposal deadlines
    const result: DeadlineProcessingResult = await proposalDeadlineManager.processAllProposalDeadlines()
    
    // Log the processing result
    console.log('Deadline processing completed:', {
      processedAt: result.processedAt,
      proposalsChecked: result.proposalsChecked,
      notificationsSent: result.notificationsSent,
      transitionsPerformed: result.transitionsPerformed,
      errorCount: result.errors.length
    })

    // If there were errors, log them but still return success
    if (result.errors.length > 0) {
      console.error('Errors during deadline processing:', result.errors)
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Processed ${result.proposalsChecked} proposals, sent ${result.notificationsSent} notifications, performed ${result.transitionsPerformed} transitions`
    })

  } catch (error) {
    console.error('Fatal error in deadline processing:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Support POST method as well for webhook integrations
export async function POST(request: NextRequest) {
  return GET(request)
}

// Export the route configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' 