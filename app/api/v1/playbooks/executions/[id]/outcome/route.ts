/**
 * Record Playbook Outcome API
 * 
 * POST /api/v1/playbooks/executions/[id]/outcome
 * Record an outcome from a playbook execution
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { validateInput } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'
import { z } from 'zod'

const outcomeSchema = z.object({
  outcome_type: z.string().min(1, 'Outcome type is required'),
  outcome_value: z.number().optional(),
  outcome_description: z.string().optional(),
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

    const { id: executionId } = await params
    const body = await req.json()
    const validation = outcomeSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('Invalid request data', 400)
    }

    const { outcome_type, outcome_value, outcome_description } = validation.data

    const sanitizedExecutionId = validateInput(executionId, 'uuid')

    await SuccessPlaybooksService.recordOutcome(
      sanitizedExecutionId,
      outcome_type,
      outcome_value,
      outcome_description
    )

    return successResponse({ success: true }, 'Outcome recorded successfully')
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to record outcome',
      500
    )
  }
}
