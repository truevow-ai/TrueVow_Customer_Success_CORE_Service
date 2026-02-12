/**
 * Playbooks API
 * 
 * GET /api/v1/playbooks - Get playbooks
 * POST /api/v1/playbooks - Create playbook
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput, sanitizeObject } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'
import { z } from 'zod'

const playbookSchema = z.object({
  playbook_name: z.string().min(1, 'Playbook name is required'),
  playbook_description: z.string().optional(),
  playbook_category: z.enum(['upsell', 'onboarding', 'retention', 'expansion', 'renewal', 'custom']),
  trigger_type: z.enum(['manual', 'health_score', 'usage_pattern', 'milestone', 'event', 'schedule']),
  trigger_conditions: z.record(z.any()).optional(),
  steps: z.array(z.object({
    step_id: z.string(),
    step_order: z.number(),
    step_type: z.enum(['email', 'sms', 'call', 'task', 'wait', 'condition']),
    step_name: z.string(),
    step_config: z.record(z.any()),
    step_conditions: z.record(z.any()).optional(),
    step_actions: z.record(z.any()).optional(),
  })),
  max_executions_per_customer: z.number().int().min(1).default(1),
  execution_window_days: z.number().int().optional(),
  cooldown_days: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
}).strict()

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const tenantIdParam = searchParams.get('tenant_id')
      const categoryParam = searchParams.get('category')
      const includeDefaults = searchParams.get('include_defaults') !== 'false'

      const tenantId = tenantIdParam ? validateInput(tenantIdParam, 'uuid') : undefined
      const category = categoryParam || undefined

      const playbooks = await SuccessPlaybooksService.getPlaybooks(tenantId, category, includeDefaults)

      return successResponse(playbooks)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get playbooks',
        500
      )
    }
  })
)

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const body = await req.json()
      const validation = playbookSchema.safeParse(body)

      if (!validation.success) {
        return errorResponse('Invalid request data', 400)
      }

      const playbookData = validation.data

      // Sanitize steps
      const sanitizedSteps = playbookData.steps.map(step => ({
        ...step,
        step_config: sanitizeObject(step.step_config),
        step_conditions: step.step_conditions ? sanitizeObject(step.step_conditions) : undefined,
        step_actions: step.step_actions ? sanitizeObject(step.step_actions) : undefined,
      }))

      const playbook = await SuccessPlaybooksService.createPlaybook({
        ...playbookData,
        steps: sanitizedSteps,
        trigger_conditions: playbookData.trigger_conditions ? sanitizeObject(playbookData.trigger_conditions) : {},
      })

      return successResponse(playbook, 'Playbook created successfully')
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to create playbook',
        500
      )
    }
  })
)
