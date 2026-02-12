/**
 * Beacon Session Update API
 * 
 * PATCH /api/v1/beacon/session/[id] - Update session activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { BeaconAPIService } from '@/lib/services/beacon-api-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const body = await req.json()
    const { page_url, page_title, page_features } = body

    if (!page_url) {
      return errorResponse('page_url is required', 400)
    }

    await BeaconAPIService.updateSessionActivity(sessionId, {
      page_url,
      page_title,
      page_features,
    })

    return successResponse({ success: true })
  } catch (error: any) {
    console.error('Error updating beacon session:', error)
    return errorResponse('Failed to update session', 500, error.message)
  }
}
