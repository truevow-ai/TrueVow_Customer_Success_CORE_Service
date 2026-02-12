/**
 * Platform Service Webhook Handler - DEPRECATED
 * 
 * POST /api/v1/webhooks/platform/milestone
 * 
 * ⚠️ DEPRECATED: This endpoint is deprecated. Onboarding workflows have been moved to SaaS Admin service.
 * This webhook should be updated to call the SaaS Admin service instead.
 * 
 * This endpoint will return 410 Gone to indicate the resource is no longer available.
 */

import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  // Return 410 Gone - Resource has been moved to SaaS Admin
  return errorResponse(
    'This webhook endpoint has been deprecated. Onboarding workflows have been moved to SaaS Admin service. ' +
    'Please update your webhook configuration to call the SaaS Admin service instead.',
    410
  )
}
