/**
 * Playbook by ID API
 * 
 * GET /api/v1/playbooks/[id] - Get playbook by ID
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { validateInput } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: playbookId } = await params

    if (!playbookId) {
      return errorResponse('Playbook ID is required', 400)
    }

    const sanitizedId = validateInput(playbookId, 'uuid')

    const playbook = await SuccessPlaybooksService.getPlaybookById(sanitizedId)

    if (!playbook) {
      return errorResponse('Playbook not found', 404)
    }

    return successResponse(playbook)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get playbook',
      500
    )
  }
}
