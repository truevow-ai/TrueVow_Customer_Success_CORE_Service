/**
 * GET /api/v1/faqs/categories
 * 
 * Get all FAQ categories
 */

import { NextRequest, NextResponse } from 'next/server'
import { FAQRepositoryService } from '@/lib/services/faq-repository-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const tenant_id = searchParams.get('tenant_id') || undefined

    const categories = await FAQRepositoryService.getCategories(tenant_id)

    return successResponse({ categories })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return errorResponse('Failed to fetch categories', 500)
  }
}
