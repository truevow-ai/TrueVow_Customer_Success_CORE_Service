/**
 * API Route: Get Renewal by ID
 * GET /api/v1/renewal/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { RenewalOrchestrationService } from '@/lib/services/renewal-orchestration'
import { getAuth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await getAuth(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const renewal = await RenewalOrchestrationService.getRenewalById(params.id)

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
