/**
 * CRM Sync API
 * 
 * SECURITY MODEL:
 * - Only authenticated team members can trigger CRM syncs
 * - AI agents can call these endpoints, but they use team member authentication
 * - The actual Intakely CRM API calls happen server-side with service credentials
 * - AI agents NEVER have direct access to Intakely CRM API keys
 * - All CRM operations are logged and auditable
 * 
 * SECURITY PROTECTIONS:
 * - Input validation and sanitization (prevents injection attacks)
 * - Rate limiting (prevents abuse)
 * - Permission checks (not all roles can sync)
 * - Audit logging (all operations logged)
 * - Tenant isolation (can only sync own tenant's tickets)
 * - Request validation (ticket ownership verification)
 * 
 * AI Agent Usage:
 * - AI agents can POST to /api/v1/crm/sync with their authenticated context
 * - The service validates the request and performs the CRM operation server-side
 * - AI agents receive the result but never see CRM API keys or make direct CRM calls
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { logAuditEntry, getIpAddress, getUserAgent } from '@/lib/middleware/audit-log'
import { validateInput, validateTicketId, validateAction, sanitizeObject } from '@/lib/utils/input-sanitization'
import { CRMSyncService } from '@/lib/services/crm-sync'
import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { TicketRepository } from '@/lib/repositories/tickets'
import { requirePermission } from '@/lib/middleware/auth'
import { z } from 'zod'

const syncSchema = z.object({
  ticket_id: z.string().uuid('Invalid ticket ID').refine(
    (val) => {
      try {
        validateTicketId(val)
        return true
      } catch {
        return false
      }
    },
    { message: 'Invalid ticket ID format' }
  ),
  action: z.enum(['create', 'update', 'sync_all']).optional().default('create'),
}).strict() // Reject unknown fields

/**
 * POST /api/v1/crm/sync
 * Sync a ticket to Intakely CRM
 * 
 * SECURITY: Requires authenticated team member (human or AI agent with team member context)
 * The actual CRM API call happens server-side - AI agents never see CRM credentials
 * 
 * SECURITY PROTECTIONS:
 * - Rate limiting (10 requests per minute per user)
 * - Permission check (requires 'crm:sync' permission)
 * - Input validation and sanitization
 * - Tenant isolation (can only sync own tenant's tickets)
 * - Ticket ownership verification
 * - Audit logging
 */
export const POST = withRateLimit(
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyGenerator: (req) => {
      // Rate limit per user ID
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `crm-sync:${userId}`
    },
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      // SECURITY: Validate and sanitize input
      const body = await req.json()
      
      // Sanitize entire request body
      const sanitizedBody = sanitizeObject(body)
      
      // Validate with Zod schema
      const validation = syncSchema.safeParse(sanitizedBody)
      if (!validation.success) {
        // Log suspicious input
        await logAuditEntry({
          action: 'crm_sync_validation_failed',
          resource_type: 'ticket',
          resource_id: body.ticket_id || 'unknown',
          user_id: context.userId,
          team_member_id: context.teamMemberId,
          tenant_id: 'unknown',
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
          request_body: sanitizedBody,
          error_message: validation.error.message,
        })
        return errorResponse('Invalid request data', 400)
      }

      const { ticket_id, action } = validation.data

      // SECURITY: Additional validation
      const sanitizedTicketId = validateTicketId(ticket_id)
      const sanitizedAction = validateAction(action)

      // Get team member for tenant validation
      const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
      if (!teamMember) {
        return errorResponse('Team member not found', 404)
      }

      // SECURITY: Permission check - not all roles can sync to CRM
      // Only support_agent, support_manager, csm, solutions_engineer can sync
      const allowedRoles = ['support_agent', 'support_manager', 'csm', 'solutions_engineer']
      if (!context.role || !allowedRoles.includes(context.role)) {
        await logAuditEntry({
          action: 'crm_sync_unauthorized',
          resource_type: 'ticket',
          resource_id: sanitizedTicketId,
          user_id: context.userId,
          team_member_id: context.teamMemberId,
          tenant_id: teamMember.tenant_id || '',
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
          request_body: { ticket_id: sanitizedTicketId, action: sanitizedAction },
          error_message: `Role ${context.role} not allowed to sync CRM`,
        })
        return errorResponse('Insufficient permissions to sync CRM', 403)
      }

      // SECURITY: Verify ticket ownership (tenant isolation)
      if (sanitizedAction !== 'sync_all') {
        const ticket = await TicketRepository.findById(sanitizedTicketId)
        if (!ticket) {
          return errorResponse('Ticket not found', 404)
        }

        // Verify tenant matches (prevent cross-tenant access)
        if (ticket.tenant_id !== teamMember.tenant_id) {
          await logAuditEntry({
            action: 'crm_sync_tenant_mismatch',
            resource_type: 'ticket',
            resource_id: sanitizedTicketId,
            user_id: context.userId,
            team_member_id: context.teamMemberId,
            tenant_id: teamMember.tenant_id || '',
            ip_address: getIpAddress(req),
            user_agent: getUserAgent(req),
            request_body: { ticket_id: sanitizedTicketId, action: sanitizedAction },
            error_message: `Ticket tenant ${ticket.tenant_id} does not match user tenant ${teamMember.tenant_id}`,
          })
          return errorResponse('Unauthorized: Ticket does not belong to your tenant', 403)
        }
      }

      // SECURITY: All CRM operations happen server-side here
      // The CRMSyncService uses service-level credentials that AI agents never see

      // Log audit entry before operation
      await logAuditEntry({
        action: `crm_sync_${sanitizedAction}`,
        resource_type: 'ticket',
        resource_id: sanitizedAction === 'sync_all' ? 'all' : sanitizedTicketId,
        user_id: context.userId,
        team_member_id: context.teamMemberId,
        tenant_id: teamMember.tenant_id || '',
        ip_address: getIpAddress(req),
        user_agent: getUserAgent(req),
        request_body: { ticket_id: sanitizedTicketId, action: sanitizedAction },
      })

      let result: any
      let responseMessage: string

      if (sanitizedAction === 'sync_all') {
        // Sync all pending tickets
        result = await CRMSyncService.syncPendingTickets(teamMember.tenant_id || '')
        responseMessage = 'Sync completed'
      } else if (sanitizedAction === 'create') {
        const crmCase = await CRMSyncService.createCaseInCRM(sanitizedTicketId)
        result = { case: crmCase }
        responseMessage = 'Case created in CRM'
      } else if (sanitizedAction === 'update') {
        const crmCase = await CRMSyncService.updateCaseInCRM(sanitizedTicketId)
        result = { case: crmCase }
        responseMessage = 'Case updated in CRM'
      } else {
        return errorResponse('Invalid action', 400)
      }

      // Log successful operation
      await logAuditEntry({
        action: `crm_sync_${sanitizedAction}_success`,
        resource_type: 'ticket',
        resource_id: sanitizedAction === 'sync_all' ? 'all' : sanitizedTicketId,
        user_id: context.userId,
        team_member_id: context.teamMemberId,
        tenant_id: teamMember.tenant_id || '',
        ip_address: getIpAddress(req),
        user_agent: getUserAgent(req),
        request_body: { ticket_id: sanitizedTicketId, action: sanitizedAction },
        response_status: 200,
        metadata: { result_summary: JSON.stringify(result).substring(0, 500) },
      })

      return successResponse(result, responseMessage)
    } catch (error) {
      // Log error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await logAuditEntry({
        action: 'crm_sync_error',
        resource_type: 'ticket',
        resource_id: 'unknown',
        user_id: context.userId,
        team_member_id: context.teamMemberId,
        tenant_id: 'unknown',
        ip_address: getIpAddress(req),
        user_agent: getUserAgent(req),
        request_body: {},
        response_status: 500,
        error_message: errorMessage,
      })

      // Don't expose internal error details
      return errorResponse('Failed to sync to CRM', 500)
    }
  })
)

/**
 * GET /api/v1/crm/sync/status
 * Get sync status for a ticket
 * 
 * SECURITY: Requires authenticated team member
 * Returns sync status but never exposes CRM API credentials
 * 
 * SECURITY PROTECTIONS:
 * - Input validation
 * - Tenant isolation
 * - Rate limiting
 */
export const GET = withRateLimit(
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute (read-only, higher limit)
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const ticketIdParam = searchParams.get('ticket_id')

      if (!ticketIdParam) {
        return errorResponse('Ticket ID is required', 400)
      }

      // SECURITY: Validate and sanitize ticket ID
      const ticketId = validateTicketId(ticketIdParam)

      // Get team member for tenant validation
      const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
      if (!teamMember) {
        return errorResponse('Team member not found', 404)
      }

      // SECURITY: Verify ticket ownership (tenant isolation)
      const ticket = await TicketRepository.findById(ticketId)
      if (!ticket) {
        return errorResponse('Ticket not found', 404)
      }

      // Verify tenant matches
      if (ticket.tenant_id !== teamMember.tenant_id) {
        await logAuditEntry({
          action: 'crm_sync_status_unauthorized',
          resource_type: 'ticket',
          resource_id: ticketId,
          user_id: context.userId,
          team_member_id: context.teamMemberId,
          tenant_id: teamMember.tenant_id || '',
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
          error_message: `Ticket tenant ${ticket.tenant_id} does not match user tenant ${teamMember.tenant_id}`,
        })
        return errorResponse('Unauthorized: Ticket does not belong to your tenant', 403)
      }

      const syncStatus = await CRMSyncService.getSyncStatus(ticketId)
      
      if (!syncStatus) {
        return successResponse({ synced: false, status: null })
      }

      // SECURITY: Sanitize response (don't expose internal details)
      return successResponse({
        synced: syncStatus.syncStatus === 'synced',
        status: {
          syncStatus: syncStatus.syncStatus,
          crmCaseId: syncStatus.crmCaseId,
          lastSyncedAt: syncStatus.lastSyncedAt,
          // Don't expose error messages or internal metadata
        },
      })
    } catch (error) {
      // Don't expose internal error details
      return errorResponse('Failed to get sync status', 500)
    }
  })
)



