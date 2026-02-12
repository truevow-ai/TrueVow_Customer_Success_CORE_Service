/**
 * Beacon API - Suggest
 * 
 * POST /api/v1/beacon/suggest - Get contextual article suggestions
 */

import { NextRequest, NextResponse } from 'next/server'
import { BeaconAPIService } from '@/lib/services/beacon-api-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { context, limit } = body

    if (!context || !context.page_url) {
      return errorResponse('context with page_url is required', 400)
    }

    const articles = await BeaconAPIService.suggest(context, limit || 5)

    return successResponse(articles)
  } catch (error: any) {
    console.error('Error getting beacon suggestions:', error)
    return errorResponse('Failed to get suggestions', 500, error.message)
  }
}
