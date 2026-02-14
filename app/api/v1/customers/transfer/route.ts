/**
 * Customer Transfer API
 * 
 * POST /api/v1/customers/transfer - Transfer customer from SaaS Admin to CS-Support
 * 
 * Called by SaaS Admin service after customer accepts go-live.
 * Creates post-onboarding customer record and assigns Client Success Manager.
 * 
 * SECURITY: This endpoint should be protected with API key authentication
 * from SaaS Admin service.
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { CustomerTransferService } from '@/lib/services/customer-transfer'

/**
 * POST /api/v1/customers/transfer
 * Transfer customer from SaaS Admin to CS-Support after go-live
 * 
 * Request Body:
 * {
 *   "customer_id": "uuid" (optional),
 *   "tenant_id": "uuid",
 *   "customer_email": "string",
 *   "go_live_date": "ISO timestamp",
 *   "onboarding_completed_at": "ISO timestamp",
 *   "assigned_csm_id": "uuid" (optional),
 *   "initial_health_score": number (optional),
 *   "notes": "string" (optional),
 *   "metadata": {} (optional)
 * }
 * 
 * Access: Should be called by SaaS Admin service (API key protected)
 */
export async function POST(req: NextRequest) {
  // TODO: Add API key authentication for SaaS Admin service
  // For now, using team member auth as fallback
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const body = await req.json()

      // Validate required fields
      if (!body.tenant_id || !body.customer_email || !body.go_live_date || !body.onboarding_completed_at) {
        return errorResponse(
          'Missing required fields: tenant_id, customer_email, go_live_date, onboarding_completed_at',
          400
        )
      }

      // Transfer customer
      const result = await CustomerTransferService.transferCustomer({
        customer_id: body.customer_id,
        tenant_id: body.tenant_id,
        customer_email: body.customer_email,
        go_live_date: body.go_live_date,
        onboarding_completed_at: body.onboarding_completed_at,
        assigned_csm_id: body.assigned_csm_id || null,
        initial_health_score: body.initial_health_score || null,
        notes: body.notes || null,
        metadata: body.metadata || null,
      })

      return successResponse(result)
    } catch (error) {
      console.error('Customer transfer error:', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to transfer customer',
        500
      )
    }
  })(req)
}

/**
 * GET /api/v1/customers/transfer?customer_email=...&tenant_id=...
 * Check transfer status for a customer
 */
export async function GET(req: NextRequest) {
  return withTeamMember(async (req: NextRequest, context) => {
    try {
      const { searchParams } = new URL(req.url)
      const customerEmail = searchParams.get('customer_email')
      const tenantId = searchParams.get('tenant_id')

      if (!customerEmail || !tenantId) {
        return errorResponse('Missing required query parameters: customer_email, tenant_id', 400)
      }

      const status = await CustomerTransferService.getTransferStatus(customerEmail, tenantId)

      return successResponse(status)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get transfer status',
        500
      )
    }
  })(req)
}



