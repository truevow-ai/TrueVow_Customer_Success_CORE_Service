/**
 * Playbook by ID API
 * 
 * GET /api/v1/playbooks/[id] - Get playbook by ID
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context: { params: { id: string } }) => {
    try {
      const playbookId = context.params.id

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
  })
)
