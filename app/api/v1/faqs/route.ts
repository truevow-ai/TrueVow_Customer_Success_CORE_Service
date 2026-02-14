/**
 * FAQ Management API
 * 
 * GET /api/v1/faqs - Get all FAQs (with optional filters)
 * POST /api/v1/faqs - Create new FAQ
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/db/supabase'
import { FAQRepositoryService } from '@/lib/services/faq-repository-service'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withTeamMember } from '@/lib/middleware/auth'

/**
 * GET /api/v1/faqs
 * Get all FAQs with optional filters
 */
export const GET = withTeamMember(async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    const tenant_id = searchParams.get('tenant_id') || undefined
    const include_inactive = searchParams.get('include_inactive') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerSupabase()
    let queryBuilder = supabase
      .from('cs_faq_entries')
      .select('*', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Only filter by is_active if not including inactive (for admin UI)
    if (!include_inactive) {
      queryBuilder = queryBuilder.eq('is_active', true)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (tenant_id) {
      queryBuilder = queryBuilder.or(`tenant_id.eq.${tenant_id},tenant_id.is.null,is_default.eq.true`)
    } else {
      queryBuilder = queryBuilder.or('tenant_id.is.null,is_default.eq.true')
    }

    const { data: faqs, error, count } = await queryBuilder

    if (error) {
      console.error('Error fetching FAQs:', error)
      return errorResponse('Failed to fetch FAQs', 500)
    }

    return successResponse({
      faqs: faqs || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Error in GET /api/v1/faqs:', error)
    return errorResponse('Failed to fetch FAQs', 500)
  }
})

/**
 * POST /api/v1/faqs
 * Create new FAQ entry
 */
export const POST = withTeamMember(async (req: NextRequest) => {
  try {
    const { userId } = await auth()
    if (!userId) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await req.json()
    const {
      question,
      answer,
      category,
      match_keywords = [],
      match_intents = [],
      tags = [],
      priority = 0,
      tenant_id,
      is_default = false,
      related_article_id,
      related_link_url,
      related_link_text,
      metadata = {},
    } = body

    if (!question || !answer) {
      return errorResponse('Question and answer are required', 400)
    }

    const supabase = createServerSupabase()

    // Get user's tenant_id if not provided
    let finalTenantId = tenant_id
    if (!finalTenantId) {
      const { data: teamMember } = await supabase
        .from('cs_team_members')
        .select('tenant_id')
        .eq('clerk_user_id', userId)
        .single()

      if (teamMember) {
        finalTenantId = teamMember.tenant_id
      }
    }

    const { data: faq, error } = await supabase
      .from('cs_faq_entries')
      .insert({
        question,
        answer,
        category: category || null,
        match_keywords: match_keywords || [],
        match_intents: match_intents || [],
        tags: tags || [],
        priority: priority || 0,
        tenant_id: finalTenantId || null,
        is_default: is_default || false,
        is_active: true,
        related_article_id: related_article_id || null,
        related_link_url: related_link_url || null,
        related_link_text: related_link_text || null,
        created_by: userId,
        metadata: {
          ...metadata,
          created_via: 'admin_ui',
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return errorResponse('Failed to create FAQ', 500)
    }

    return successResponse({ faq }, 201)
  } catch (error: any) {
    console.error('Error in POST /api/v1/faqs:', error)
    return errorResponse('Failed to create FAQ', 500)
  }
})



