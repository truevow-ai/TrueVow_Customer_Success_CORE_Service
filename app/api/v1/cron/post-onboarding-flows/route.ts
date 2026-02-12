/**
 * Cron Job: Post-Onboarding Flows
 * 
 * POST /api/v1/cron/post-onboarding-flows
 * Processes check-ins, health alerts, usage alerts, and renewal reminders
 * 
 * Protected by API key authentication
 */

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withApiKey } from '@/lib/middleware/api-key'
import { processPostOnboardingFlows } from '@/scripts/scheduled-jobs/post-onboarding-flows'

/**
 * POST /api/v1/cron/post-onboarding-flows
 * Run post-onboarding flows processing
 */
export async function POST(req: NextRequest) {
  return withApiKey(async (req: NextRequest) => {
    try {
      console.log('🔄 Starting post-onboarding flows cron job')
      
      await processPostOnboardingFlows()
      
      return successResponse(
        { processed: true, timestamp: new Date().toISOString() },
        'Post-onboarding flows processed successfully'
      )
    } catch (error) {
      console.error('❌ Error in post-onboarding flows cron job:', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to process post-onboarding flows',
        500
      )
    }
  })(req)
}
