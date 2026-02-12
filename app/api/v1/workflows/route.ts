/**
 * Workflows API
 * 
 * GET /api/v1/workflows - List workflows
 * POST /api/v1/workflows - Create workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { createServerSupabase } from '@/lib/db/supabase'
import { successResponse, errorResponse, getPagination } from '@/lib/api/helpers'

export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const searchParams = req.nextUrl.searchParams
    const contextType = searchParams.get('context_type') || undefined
    const triggerType = searchParams.get('trigger_type') || undefined
    const { page, limit, offset } = getPagination(req)

    const supabase = createServerSupabase()
    let query = supabase
      .from('workflow_definitions')
      .select('*', { count: 'exact' })

    if (contextType) {
      query = query.or(`context_type.eq.${contextType},context_type.eq.all`)
    }

    if (triggerType) {
      query = query.eq('trigger_type', triggerType)
    }

    if (context.tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${context.tenantId}`)
    } else {
      query = query.is('tenant_id', null)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return successResponse({
      workflows: data || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error: any) {
    console.error('Error fetching workflows:', error)
    return errorResponse('Failed to fetch workflows', 500, error.message)
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await req.json()
    const { name, description, context_type, trigger_type, conditions, actions } = body

    if (!name || !context_type || !trigger_type || !conditions || !actions) {
      return errorResponse('Missing required fields', 400)
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({
        name,
        description,
        context_type,
        trigger_type,
        conditions,
        actions,
        created_by: context.userId,
        tenant_id: context.tenantId,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return successResponse(data)
  } catch (error: any) {
    console.error('Error creating workflow:', error)
    return errorResponse('Failed to create workflow', 500, error.message)
  }
}
