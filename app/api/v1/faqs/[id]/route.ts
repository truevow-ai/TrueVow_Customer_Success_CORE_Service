/**
 * FAQ Detail API
 * 
 * GET /api/v1/faqs/[id] - Get FAQ by ID
 * PUT /api/v1/faqs/[id] - Update FAQ
 * DELETE /api/v1/faqs/[id] - Delete FAQ (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/db/supabase'
import { FAQRepositoryService } from '@/lib/services/faq-repository-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withTeamMember } from '@/lib/middleware/auth'

/**
 * GET /api/v1/faqs/[id]
 * Get FAQ by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params
    const faq = await FAQRepositoryService.getFAQById(id)

    if (!faq) {
      return errorResponse('FAQ not found', 404)
    }

    return successResponse({ faq })
  } catch (error: any) {
    console.error('Error in GET /api/v1/faqs/[id]:', error)
    return errorResponse('Failed to fetch FAQ', 500)
  }
}

/**
 * PUT /api/v1/faqs/[id]
 * Update FAQ
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params
    const body = await req.json()

    const supabase = await createServerSupabase()

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.question !== undefined) updateData.question = body.question
    if (body.answer !== undefined) updateData.answer = body.answer
    if (body.category !== undefined) updateData.category = body.category || null
    if (body.match_keywords !== undefined) updateData.match_keywords = body.match_keywords || []
    if (body.match_intents !== undefined) updateData.match_intents = body.match_intents || []
    if (body.tags !== undefined) updateData.tags = body.tags || []
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.is_default !== undefined) updateData.is_default = body.is_default
    if (body.related_article_id !== undefined) updateData.related_article_id = body.related_article_id || null
    if (body.related_link_url !== undefined) updateData.related_link_url = body.related_link_url || null
    if (body.related_link_text !== undefined) updateData.related_link_text = body.related_link_text || null
    if (body.metadata !== undefined) {
      updateData.metadata = {
        ...(body.metadata || {}),
        updated_via: 'admin_ui',
        updated_by: userId,
      }
    }

    const { data: faq, error } = await supabase
      .from('cs_faq_entries')
      .update(updateData)
      .eq('faq_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FAQ:', error)
      return errorResponse('Failed to update FAQ', 500)
    }

    if (!faq) {
      return errorResponse('FAQ not found', 404)
    }

    return successResponse({ faq })
  } catch (error: any) {
    console.error('Error in PUT /api/v1/faqs/[id]:', error)
    return errorResponse('Failed to update FAQ', 500)
  }
}

/**
 * DELETE /api/v1/faqs/[id]
 * Soft delete FAQ (set is_active = false)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createServerSupabase()

    const { data: faq, error } = await supabase
      .from('cs_faq_entries')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('faq_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting FAQ:', error)
      return errorResponse('Failed to delete FAQ', 500)
    }

    if (!faq) {
      return errorResponse('FAQ not found', 404)
    }

    return successResponse({ message: 'FAQ deleted successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/faqs/[id]:', error)
    return errorResponse('Failed to delete FAQ', 500)
  }
}
