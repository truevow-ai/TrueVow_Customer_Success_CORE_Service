import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/middleware/api-key'
import { checkRateLimit } from '@/lib/middleware/rate-limit'

/**
 * POST /api/v1/customer-portal/ai/chat
 * Benjamin AI chat endpoint for customer portal
 * This endpoint is called by Tenant Service on behalf of customers
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key (service-to-service auth)
    const apiKeyValid = await verifyApiKey(request)
    if (!apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: 30 requests per minute per tenant
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    
    if (tenantId) {
      const rateLimitResult = await checkRateLimit(request, {
        key: `customer-portal-chat:${tenantId}`,
        limit: 30,
        window: 60, // 1 minute
      })

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
          { status: 429 }
        )
      }
    }

    const body = await request.json()
    const { message, conversation_id, tenant_id, customer_id } = body

    if (!message || !tenant_id) {
      return NextResponse.json(
        { error: 'message and tenant_id are required' },
        { status: 400 }
      )
    }

    // TODO: Integrate with AI agent (Benjamin persona)
    // For now, return a placeholder response
    // This will be implemented when AI agents are ready

    return NextResponse.json({
      data: {
        response: 'AI chat functionality will be available soon. Please contact support for assistance.',
        conversation_id: conversation_id || `conv_${Date.now()}`,
        metadata: {
          ai_enabled: false,
          fallback: true,
        },
      },
    })
  } catch (error: any) {
    console.error('Error in customer portal AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error.message },
      { status: 500 }
    )
  }
}
