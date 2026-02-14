/**
 * Usage Event API
 * 
 * POST /api/v1/analytics/usage/event
 * Record a usage event (called by Platform Service, Tenant App, etc.)
 * 
 * SECURITY: This endpoint should be protected with API key or webhook signature
 */

import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput, sanitizeObject } from '@/lib/utils/input-sanitization'
import { UsageAnalyticsService, UsageEvent } from '@/lib/services/usage-analytics'
import { z } from 'zod'

// SECURITY: Verify API key (for service-to-service calls)
function verifyApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key')
  const expectedKey = process.env.USAGE_ANALYTICS_API_KEY
  
  if (!expectedKey) {
    console.warn('USAGE_ANALYTICS_API_KEY not configured')
    return true // Allow in development
  }
  
  return apiKey === expectedKey
}

const usageEventSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  userId: z.string().min(1, 'User ID is required'),
  eventType: z.string().min(1, 'Event type is required'),
  featureName: z.string().min(1, 'Feature name is required'),
  eventData: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
}).strict()

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 100, // Higher limit for event tracking
  },
  async (req: NextRequest) => {
    try {
      // SECURITY: Verify API key
      if (!verifyApiKey(req)) {
        return errorResponse('Invalid API key', 401)
      }

      const body = await req.json()
      const validation = usageEventSchema.safeParse(body)
      
      if (!validation.success) {
        return errorResponse('Invalid request data', 400)
      }

      const { tenantId, userId, eventType, featureName, eventData, sessionId, ipAddress, userAgent } = validation.data

      // Validate and sanitize
      const sanitizedTenantId = validateInput(tenantId, 'uuid')
      const sanitizedUserId = validateInput(userId, 'text')
      const sanitizedEventData = eventData ? sanitizeObject(eventData) : undefined

      // Record event
      const event: UsageEvent = {
        tenant_id: sanitizedTenantId,
        user_id: sanitizedUserId,
        event_type: eventType,
        feature_name: featureName,
        event_data: sanitizedEventData,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
      }

      await UsageAnalyticsService.recordEvent(event)

      return successResponse({ success: true }, 'Usage event recorded')
    } catch (error) {
      console.error('Usage event error:', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to record usage event',
        500
      )
    }
  }
)



