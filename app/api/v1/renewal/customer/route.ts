/**
 * API Route: Get Renewal by Customer
 * GET /api/v1/renewal/customer?tenant_id=...&customer_email=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { RenewalOrchestrationService } from '@/lib/services/renewal-orchestration'
import { getAuth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const customerEmail = searchParams.get('customer_email')

    if (!tenantId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required query parameters: tenant_id, customer_email' },
        { status: 400 }
      )
    }

    const renewal = await RenewalOrchestrationService.getRenewalByCustomer(
      tenantId,
      customerEmail
    )

    if (!renewal) {
      return NextResponse.json(
        { error: 'Renewal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      renewal,
    })
  } catch (error: any) {
    console.error('Error getting renewal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get renewal' },
      { status: 500 }
    )
  }
}
