/**
 * Billing Info API (Read-Only)
 * 
 * SECURITY: Read-only access to billing information
 * - All CS roles can view billing (read-only)
 * - Only specific roles can modify (see /api/v1/billing/operations)
 * - Tenant isolation enforced
 * - Rate limiting applied
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { logAuditEntry, getIpAddress, getUserAgent } from '@/lib/middleware/audit-log'
import { validateInput } from '@/lib/utils/input-sanitization'
import { BillingProxyService } from '@/lib/services/billing-proxy'
import { TeamMemberRepository } from '@/lib/repositories/team-members'

/**
 * GET /api/v1/billing/info
 * Get billing information for a tenant (read-only)
 * 
 * SECURITY: Requires authenticated team member
 * All CS roles can view billing information
 */
export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 requests per minute (read-only, higher limit)
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const tenantIdParam = searchParams.get('tenant_id')

      if (!tenantIdParam) {
        return errorResponse('Tenant ID is required', 400)
      }

      // SECURITY: Validate tenant ID
      const tenantId = validateInput(tenantIdParam, 'uuid')

      // Get team member for authorization
      const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
      if (!teamMember) {
        return errorResponse('Team member not found', 404)
      }

      // SECURITY: Verify tenant matches (prevent cross-tenant access)
      if (teamMember.tenant_id !== tenantId) {
        await logAuditEntry({
          action: 'billing_info_unauthorized',
          resource_type: 'ticket',
          resource_id: 'none',
          user_id: context.userId,
          team_member_id: context.teamMemberId,
          tenant_id: tenantId,
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
          error_message: `User tenant ${teamMember.tenant_id} does not match requested tenant ${tenantId}`,
        })
        return errorResponse('Unauthorized: Cannot access billing for other tenants', 403)
      }

      // Get billing info (read-only, server-side)
      const billingInfo = await BillingProxyService.getBillingInfo(tenantId, context.teamMemberId || context.userId)

      return successResponse(billingInfo)
    } catch (error) {
      return errorResponse('Failed to get billing information', 500)
    }
  })
)
