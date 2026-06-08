/**
 * POST /api/v1/faqs/search
 * 
 * Search FAQs for AI agents and human agents
 * Returns best match with confidence score
 */

import { NextRequest, NextResponse } from 'next/server'
import { FAQRepositoryService } from '@/lib/services/faq-repository-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return errorResponse('Query is required', 400)
    }

    const results = await FAQRepositoryService.searchFAQs(query)

    return successResponse({
      results,
      count: results.length,
    })
  } catch (error: any) {
    console.error('Error searching FAQs:', error)
    return errorResponse('Failed to search FAQs', 500)
  }
}



