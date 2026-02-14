/**
 * Evaluate Expansion Triggers API
 * 
 * POST /api/v1/expansion/triggers/evaluate
 * Evaluate expansion triggers for a customer (called by background job)
 */

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { ExpansionTriggersService } from '@/lib/services/expansion-triggers'
import { z } from 'zod'

// SECURITY: Verify API key (for background jobs)
function verifyApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key')
  const expectedKey = process.env.CRON_API_KEY || process.env.EXPANSION_API_KEY
  
  if (!expectedKey) {
    console.warn('CRON_API_KEY not configured')
    return true // Allow in development
  }
  
  return apiKey === expectedKey
}

const evaluateSchema = z.object({
  tenant_id: z.string().uuid('Invalid tenant ID'),
  customer_email: z.string().email('Invalid customer email'),
}).strict()

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
  async (req: NextRequest) => {
    try {
      // SECURITY: Verify API key
      if (!verifyApiKey(req)) {
        return errorResponse('Invalid API key', 401)
      }

      const body = await req.json()
      const validation = evaluateSchema.safeParse(body)

      if (!validation.success) {
        return errorResponse('Invalid request data', 400)
      }

      const { tenant_id, customer_email } = validation.data

      const sanitizedTenantId = validateInput(tenant_id, 'uuid')
      const sanitizedEmail = validateInput(customer_email, 'email')

      // Evaluate triggers
      await ExpansionTriggersService.evaluateTriggers(sanitizedTenantId, sanitizedEmail)

      return successResponse({ success: true }, 'Triggers evaluated successfully')
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to evaluate triggers',
        500
      )
    }
  }
)



