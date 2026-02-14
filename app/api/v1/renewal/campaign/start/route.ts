/**
 * API Route: Start Retention Campaign
 * POST /api/v1/renewal/campaign/start
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
    const { renewal_id, campaign_id } = body

    if (!renewal_id) {
      return NextResponse.json(
        { error: 'Missing required field: renewal_id' },
        { status: 400 }
      )
    }

    await RenewalOrchestrationService.startRetentionCampaign(
      renewal_id,
      campaign_id
    )

    return NextResponse.json({
      success: true,
      message: 'Retention campaign started',
    })
  } catch (error: any) {
    console.error('Error starting retention campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start retention campaign' },
      { status: 500 }
    )
  }
}



