/**
 * Execute Playbook API
 * 
 * POST /api/v1/playbooks/[id]/execute
 * Execute a playbook for a customer
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { validateInput, sanitizeObject } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'
import { z } from 'zod'

const executeSchema = z.object({
  tenant_id: z.string().uuid('Invalid tenant ID'),
  customer_email: z.string().email('Invalid customer email'),
  triggered_by: z.enum(['manual', 'system', 'event', 'schedule']).default('manual'),
  trigger_data: z.record(z.any()).optional(),
}).strict()

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: playbookId } = await params
    const body = await req.json()
    const validation = executeSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('Invalid request data', 400)
    }

    const { tenant_id, customer_email, triggered_by, trigger_data } = validation.data

    const sanitizedPlaybookId = validateInput(playbookId, 'uuid')
    const sanitizedTenantId = validateInput(tenant_id, 'uuid')
    const sanitizedEmail = validateInput(customer_email, 'email')
    const sanitizedTriggerData = trigger_data ? sanitizeObject(trigger_data) : undefined

    const execution = await SuccessPlaybooksService.executePlaybook(
      sanitizedPlaybookId,
      sanitizedTenantId,
      sanitizedEmail,
      triggered_by,
      sanitizedTriggerData
    )

    return successResponse(execution, 'Playbook execution started')
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to execute playbook',
      500
    )
  }
}
