/**
 * Dialer Permissions API
 * 
 * GET /api/v1/dialer/permissions - Get user's dialer permissions
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { DialerPermissionsService } from '@/lib/services/dialer-permissions-service'
import { createServerSupabase } from '@/lib/db/supabase'

/**
 * GET /api/v1/dialer/permissions
 * Get user's dialer permissions
 */
export async function GET(req: NextRequest) {
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const userId = context.userId || context.teamMemberId || ''

      if (!userId) {
        return errorResponse('User ID not found', 401)
      }

      // Get user's role from team members table
      const supabase = createServerSupabase()
      const { data: teamMember } = await supabase
        .from('cs_team_members')
        .select('role')
        .eq('clerk_user_id', userId)
        .single()

      const role = teamMember?.role || 'customer_support'
      const department = 'customer_support'

      // Get or create permission
      const permission = await DialerPermissionsService.getOrCreatePermission(
        userId,
        role,
        department
      )

      return successResponse(permission)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get dialer permissions',
        500
      )
    }
  })(req)
}
