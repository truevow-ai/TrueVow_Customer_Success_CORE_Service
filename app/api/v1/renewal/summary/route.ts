/**
 * API Route: Get Renewal Summary
 * GET /api/v1/renewal/summary?tenant_id=...&period_start=...&period_end=...
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
    const periodStart = searchParams.get('period_start')
      ? new Date(searchParams.get('period_start')!)
      : undefined
    const periodEnd = searchParams.get('period_end')
      ? new Date(searchParams.get('period_end')!)
      : undefined

    const summary = await RenewalOrchestrationService.getRenewalSummary(
      tenantId,
      periodStart,
      periodEnd
    )

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    console.error('Error getting renewal summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get renewal summary' },
      { status: 500 }
    )
  }
}
