/**
 * API Route: Create Renewal Tracking
 * POST /api/v1/renewal/tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { RenewalOrchestrationService } from '@/lib/services/renewal-orchestration'
import { getAuth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tenant_id, customer_email, subscription_data } = body

    if (!tenant_id || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, customer_email' },
        { status: 400 }
      )
    }

    const renewal = await RenewalOrchestrationService.createRenewalTracking(
      tenant_id,
      customer_email,
      subscription_data
    )

    return NextResponse.json({
      success: true,
      renewal,
    })
  } catch (error: any) {
    console.error('Error creating renewal tracking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create renewal tracking' },
      { status: 500 }
    )
  }
}
