/**
 * Customer Success Dashboard API
 * 
 * GET /api/v1/dashboard/onboarding - Get POST-ONBOARDING customer success dashboard data
 * 
 * NOTE: This endpoint is for Client Success Managers managing customers AFTER onboarding completion.
 * Onboarding workflows are handled by client_onboarding_manager role in SaaS Admin service.
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { CustomerSuccessDashboardService } from '@/lib/services/customer-success-dashboard'
import { hasAnyRole } from '@/lib/services/user-mapping'

/**
 * GET /api/v1/dashboard/onboarding
 * Get post-onboarding customer success dashboard data for authenticated user's tenant
 * 
 * Access: CSM and above only (manages post-onboarding customers)
 */
export async function GET(req: NextRequest) {
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      // Verify user is Client Success Manager or above (not Client Onboarding Manager)
      const hasAccess = await hasAnyRole(['csm', 'head_of_cs', 'support_manager'])
      if (!hasAccess) {
        return errorResponse('Access denied. Client Success Manager role required for customer success dashboard.', 403)
      }

      // Get user's member_id from context
      const userId = context.userId || context.teamMemberId || ''

      // Get dashboard data (post-onboarding customers only)
      // Note: tenant_id is not required for CS dashboard - team members support all customers
      const dashboardData = await CustomerSuccessDashboardService.getDashboardData(userId)

      return successResponse(dashboardData)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch customer success dashboard data',
        500
      )
    }
  })(req)
}



