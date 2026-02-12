/**
 * API Route: Get Renewals at Risk
 * GET /api/v1/renewal/at-risk?tenant_id=...&risk_threshold=70&limit=50
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
    const tenantId = searchParams.get('tenant_id') || undefined
    const riskThreshold = parseInt(searchParams.get('risk_threshold') || '70', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const renewals = await RenewalOrchestrationService.getRenewalsAtRisk(
      tenantId,
      riskThreshold,
      limit
    )

    return NextResponse.json({
      success: true,
      renewals,
      count: renewals.length,
    })
  } catch (error: any) {
    console.error('Error getting renewals at risk:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get renewals at risk' },
      { status: 500 }
    )
  }
}
