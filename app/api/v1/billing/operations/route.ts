/**
 * Billing Operations API
 * 
 * CRITICAL SECURITY:
 * - AI agents and LLMs NEVER have direct access to billing/accounting systems
 * - All billing operations go through this secure proxy
 * - Requires proper authorization (CSM, Head of CS, Support Manager only)
 * - All operations are audit logged
 * - Input validation and sanitization
 * - Rate limiting (strict for billing operations)
 * - Tenant isolation
 * 
 * PROTECTED SYSTEMS:
 * - Platform Service (billing/accounting)
 * - Tenant App Service
 * - INTAKE Service
 * - DRAFT Service
 * 
 * AI agents can trigger billing operations through this endpoint, but:
 * - The actual billing API calls happen server-side
 * - AI agents never see billing API keys or credentials
 * - All operations are validated, authorized, and logged
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { logAuditEntry, getIpAddress, getUserAgent } from '@/lib/middleware/audit-log'
import { validateInput, sanitizeObject } from '@/lib/utils/input-sanitization'
import { BillingProxyService, BillingOperation } from '@/lib/services/billing-proxy'
import { TeamMemberRepository } from '@/lib/repositories/team-members'
import { TicketRepository } from '@/lib/repositories/tickets'
import { z } from 'zod'

const billingOperationSchema = z.object({
  operation: z.enum(['add_discount', 'remove_discount', 'change_tier', 'add_credit', 'refund', 'update_payment_method']),
  tenantId: z.string().uuid('Invalid tenant ID'),
  amount: z.number().min(0).max(1000000).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountReason: z.string().max(500).optional(),
  newTier: z.string().max(100).optional(),
  creditAmount: z.number().min(0).max(1000000).optional(),
  creditReason: z.string().max(500).optional(),
  refundAmount: z.number().min(0).max(1000000).optional(),
  refundReason: z.string().max(500).optional(),
  ticketId: z.string().uuid('Invalid ticket ID').optional(), // Optional: link to ticket
  metadata: z.record(z.any()).optional(),
}).strict() // Reject unknown fields

/**
 * POST /api/v1/billing/operations
 * Execute a billing operation (discount, tier change, credit, refund, etc.)
 * 
 * SECURITY PROTECTIONS:
 * - Rate limiting (5 requests per minute - strict for billing)
 * - Permission check (CSM, Head of CS, Support Manager only)
 * - Input validation and sanitization
 * - Tenant isolation
 * - Audit logging
 */
export const POST = withRateLimit(
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute (strict for billing)
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `billing-op:${userId}`
    },
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      // SECURITY: Validate and sanitize input
      const body = await req.json()
      const sanitizedBody = sanitizeObject(body)
      
      const validation = billingOperationSchema.safeParse(sanitizedBody)
      if (!validation.success) {
        // Log suspicious input
        await logAuditEntry({
          action: 'billing_operation_validation_failed',
          resource_type: 'ticket',
          resource_id: body.ticketId || 'unknown',
          user_id: context.userId,
          team_member_id: context.teamMemberId,
          tenant_id: body.tenantId || 'unknown',
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
          request_body: sanitizedBody,
          error_message: validation.error.message,
        })
        return errorResponse('Invalid request data', 400)
      }

      const { tenantId, ticketId, ...operationData } = validation.data

      // SECURITY: Validate tenant ID
      const sanitizedTenantId = validateInput(tenantId, 'uuid')

      // Get team member for authorization
      const teamMember = await TeamMemberRepository.findByClerkUserId(context.userId)
      if (!teamMember) {
        return errorResponse('Team member not found', 404)
      }

      // SECURITY: Permission check - only specific roles can modify billing
      const allowedRoles = ['csm', 'head_of_cs', 'support_manager']
      if (!context.role || !allowedRoles.includes(context.role)) {
        await logAuditEntry({
          action: 'billing_operation_unauthorized',
          resource_type: 'ticket',
          resource_id: ticketId || 'unknown',
          user_id: context.userId,
          team_member_id: context.teamMemberId,
          tenant_id: sanitizedTenantId,
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
          request_body: sanitizedBody,
          error_message: `Role ${context.role} not allowed to modify billing`,
        })
        return errorResponse('Insufficient permissions: Only CSM, Head of CS, and Support Managers can modify billing', 403)
      }

      // SECURITY: Verify tenant matches (prevent cross-tenant operations)
      if (teamMember.tenant_id !== sanitizedTenantId) {
        await logAuditEntry({
          action: 'billing_operation_tenant_mismatch',
          resource_type: 'ticket',
          resource_id: ticketId || 'unknown',
          user_id: context.userId,
          team_member_id: context.teamMemberId,
          tenant_id: sanitizedTenantId,
          ip_address: getIpAddress(req),
          user_agent: getUserAgent(req),
          request_body: sanitizedBody,
          error_message: `User tenant ${teamMember.tenant_id} does not match operation tenant ${sanitizedTenantId}`,
        })
        return errorResponse('Unauthorized: Cannot perform billing operations for other tenants', 403)
      }

      // SECURITY: If ticket ID provided, verify it belongs to the tenant
      if (ticketId) {
        const sanitizedTicketId = validateInput(ticketId, 'uuid')
        const ticket = await TicketRepository.findById(sanitizedTicketId)
        if (!ticket) {
          return errorResponse('Ticket not found', 404)
        }
        if (ticket.tenant_id !== sanitizedTenantId) {
          return errorResponse('Unauthorized: Ticket does not belong to this tenant', 403)
        }
      }

      // Log audit entry before operation
      await logAuditEntry({
        action: `billing_operation_${operationData.operation}`,
        resource_type: 'ticket',
        resource_id: ticketId || 'none',
        user_id: context.userId,
        team_member_id: context.teamMemberId,
        tenant_id: sanitizedTenantId,
        ip_address: getIpAddress(req),
        user_agent: getUserAgent(req),
        request_body: sanitizedBody,
      })

      // SECURITY: Execute operation server-side (AI agents never see billing API keys)
      const operation: BillingOperation = {
        ...operationData,
        tenantId: sanitizedTenantId,
        metadata: {
          ...operationData.metadata,
          ticket_id: ticketId,
          requested_by_user_id: context.userId,
          requested_by_team_member_id: context.teamMemberId,
          timestamp: new Date().toISOString(),
        },
      }

      const result = await BillingProxyService.executeBillingOperation(
        operation,
        context.teamMemberId || context.userId,
        sanitizedTenantId
      )

      // Log successful operation
      await logAuditEntry({
        action: `billing_operation_${operationData.operation}_success`,
        resource_type: 'ticket',
        resource_id: ticketId || 'none',
        user_id: context.userId,
        team_member_id: context.teamMemberId,
        tenant_id: sanitizedTenantId,
        ip_address: getIpAddress(req),
        user_agent: getUserAgent(req),
        request_body: sanitizedBody,
        response_status: 200,
        metadata: { operation_id: result.operationId },
      })

      return successResponse(result, 'Billing operation completed successfully')
    } catch (error) {
      // Log error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await logAuditEntry({
        action: 'billing_operation_error',
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
      return errorResponse('Billing operation failed', 500)
    }
  })
)
