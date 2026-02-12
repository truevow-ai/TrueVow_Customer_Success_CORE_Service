/**
 * Beacon Session API
 * 
 * POST /api/v1/beacon/session - Create Beacon session
 */

import { NextRequest, NextResponse } from 'next/server'
import { BeaconAPIService } from '@/lib/services/beacon-api-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenant_id, user_id, page_url, page_title } = body

    const session = await BeaconAPIService.createSession(
      tenant_id,
      user_id,
      {
        page_url: page_url || '',
        page_title,
      }
    )

    return successResponse(session)
  } catch (error: any) {
    console.error('Error creating beacon session:', error)
    return errorResponse('Failed to create session', 500, error.message)
  }
}
