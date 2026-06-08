/**
 * Customer Transfer API
 *
 * POST /api/v1/customers/transfer - Transfer customer from SaaS Admin to CS-Support
 *
 * SECURITY: Service-to-service endpoint protected by Bearer API key.
 * Set SAAS_ADMIN_API_KEY in CS-Support .env.local to match
 * CS_SUPPORT_API_KEY set in SaaS Admin .env.local.
 */

import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { CustomerTransferService } from '@/lib/services/customer-transfer'
import { AttributionReporter } from '@/lib/services/attribution-reporter'

// â”€â”€â”€ Service-to-service API key validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function validateServiceApiKey(request: NextRequest): boolean {
  const apiKey = process.env.SAAS_ADMIN_API_KEY || ''
  if (!apiKey) {
    console.error('SAAS_ADMIN_API_KEY is not configured â€” rejecting transfer request')
    return false
  }
  const authHeader = request.headers.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  return bearerToken === apiKey
}

/**
 * POST /api/v1/customers/transfer
 * Transfer customer from SaaS Admin after go-live.
 *
 * Payload sent by SaaS Admin law-firm-onboarding.ts â†’ transferToCSSupport():
 * {
 *   tenant_id: string
 *   customer_email: string
 *   assigned_csm_id: string | null
 *   go_live_date: string | null
 *   onboarding_completion_percentage: number
 *   source_service: "saas_admin"
 *   transferred_at: string          <-- used as onboarding_completed_at
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!validateServiceApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Accept both field naming conventions
    const goLiveDate   = body.go_live_date || body.transferred_at
    const completedAt  = body.onboarding_completed_at || body.transferred_at

    if (!body.tenant_id || !body.customer_email || !goLiveDate || !completedAt) {
      return errorResponse(
        'Missing required fields: tenant_id, customer_email, and go_live_date (or transferred_at)',
        400,
      )
    }

    const result = await CustomerTransferService.transferCustomer({
      customer_id:             body.customer_id,
      tenant_id:               body.tenant_id,
      customer_email:          body.customer_email,
      go_live_date:            goLiveDate,
      onboarding_completed_at: completedAt,
      assigned_csm_id:         body.assigned_csm_id ?? null,
      initial_health_score:    body.initial_health_score ?? null,
      notes:                   body.notes ?? null,
      metadata: {
        ...body.metadata,
        source_service:                   body.source_service || 'saas_admin',
        onboarding_completion_percentage: body.onboarding_completion_percentage ?? null,
      },
    })

    // Report attribution to Internal Ops
    await AttributionReporter.reportCustomerTransfer(body.tenant_id, 'success', {
      customer_email: body.customer_email,
      tier: body.metadata?.tier,
    })

    return successResponse(result)
  } catch (error) {
    console.error('Customer transfer error:', error)
    // Idempotency: already transferred is not a hard failure
    if (error instanceof Error && error.message.includes('already transferred')) {
      return successResponse({ already_transferred: true, message: error.message })
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to transfer customer',
      500,
    )
  }
}

/**
 * GET /api/v1/customers/transfer?customer_email=...&tenant_id=...
 * Check transfer status (also accepts API key for SaaS Admin polling).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!validateServiceApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const customerEmail = searchParams.get('customer_email')
    const tenantId      = searchParams.get('tenant_id')

    if (!customerEmail || !tenantId) {
      return errorResponse('Missing required query parameters: customer_email, tenant_id', 400)
    }

    const status = await CustomerTransferService.getTransferStatus(customerEmail, tenantId)
    return successResponse(status)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get transfer status',
      500,
    )
  }
}
