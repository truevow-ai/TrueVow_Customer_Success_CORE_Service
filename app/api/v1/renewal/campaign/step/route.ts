/**
 * API Route: Process Campaign Step
 * POST /api/v1/renewal/campaign/step
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
    const { execution_id } = body

    if (!execution_id) {
      return NextResponse.json(
        { error: 'Missing required field: execution_id' },
        { status: 400 }
      )
    }

    await RenewalOrchestrationService.processCampaignStep(execution_id)

    return NextResponse.json({
      success: true,
      message: 'Campaign step processed',
    })
  } catch (error: any) {
    console.error('Error processing campaign step:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process campaign step' },
      { status: 500 }
    )
  }
}



