import { NextRequest } from 'next/server'
import { withApiKey } from '@/lib/middleware/api-key'
import { successResponse } from '@/lib/api/helpers'

/**
 * GET /api/v1/service/health
 * Health check endpoint for service-to-service communication
 * Requires API key authentication
 */
export const GET = withApiKey(async (req: NextRequest, context) => {
  return successResponse({
    service: 'cs-support-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    caller: context.serviceName,
  })
})

