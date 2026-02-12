/**
 * API Route: Calculate Renewal Risk
 * POST /api/v1/renewal/risk/calculate
 * 
 * Calculates renewal risk score for a customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { RenewalOrchestrationService } from '@/lib/services/renewal-orchestration'
import { verifyApiKey } from '@/lib/auth/api-key'

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || !(await verifyApiKey(apiKey))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tenant_id, customer_email, renewal_id } = body

    if (!tenant_id || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, customer_email' },
        { status: 400 }
      )
    }

    const riskScore = await RenewalOrchestrationService.calculateRenewalRisk(
      tenant_id,
      customer_email,
      renewal_id
    )

    return NextResponse.json({
      success: true,
      risk_score: riskScore,
    })
  } catch (error: any) {
    console.error('Error calculating renewal risk:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate renewal risk' },
      { status: 500 }
    )
  }
}
