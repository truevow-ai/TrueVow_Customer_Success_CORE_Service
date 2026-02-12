/**
 * Beacon API - Search
 * 
 * POST /api/v1/beacon/search - Search KB articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { BeaconAPIService } from '@/lib/services/beacon-api-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, context, limit } = body

    if (!query) {
      return errorResponse('query is required', 400)
    }

    const articles = await BeaconAPIService.search(query, context, limit || 10)

    return successResponse(articles)
  } catch (error: any) {
    console.error('Error searching beacon articles:', error)
    return errorResponse('Failed to search articles', 500, error.message)
  }
}
