/**
 * Dialer Permissions Toggle API
 * 
 * POST /api/v1/dialer/permissions/toggle - Toggle dialer on/off for user
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { DialerPermissionsService } from '@/lib/services/dialer-permissions-service'
import { z } from 'zod'

const toggleSchema = z.object({
  enabled: z.boolean(),
})

/**
 * POST /api/v1/dialer/permissions/toggle
 * Toggle dialer on/off for user
 */
export async function POST(req: NextRequest) {
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const userId = context.userId || context.teamMemberId || ''

      if (!userId) {
        return errorResponse('User ID not found', 401)
      }

      // Validate request body
      const validation = await validateBody(req, toggleSchema)
      if (!validation.success) {
        return validation.response
      }

      const { enabled } = validation.data

      // Toggle dialer
      const permission = await DialerPermissionsService.toggleDialer(userId, enabled)

      return successResponse(
        {
          permission,
          message: `Dialer ${enabled ? 'enabled' : 'disabled'} successfully`,
        },
        `Dialer ${enabled ? 'enabled' : 'disabled'} successfully`
      )
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to toggle dialer',
        500
      )
    }
  })(req)
}
