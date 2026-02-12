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
    const { query, category, tenant_id, min_confidence = 0.6 } = body

    if (!query || typeof query !== 'string') {
      return errorResponse('Query is required', 400)
    }

    const result = await FAQRepositoryService.searchFAQ({
      query,
      category,
      tenant_id,
      min_confidence,
    })

    // Increment usage if FAQ found
    if (result.faq) {
      await FAQRepositoryService.incrementUsage(result.faq.faq_id)
    }

    return successResponse({
      ...result,
      // Format response for agent use
      formatted_answer: result.faq
        ? FAQRepositoryService.formatFAQResponse(result.faq, query)
        : null,
    })
  } catch (error: any) {
    console.error('Error searching FAQs:', error)
    return errorResponse('Failed to search FAQs', 500)
  }
}
