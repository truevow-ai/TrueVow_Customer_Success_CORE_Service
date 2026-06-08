/**
 * Workflow Detail API
 * 
 * GET /api/v1/workflows/[id] - Get workflow by ID
 * PUT /api/v1/workflows/[id] - Update workflow
 * DELETE /api/v1/workflows/[id] - Delete workflow (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { createServerSupabase } from '@/lib/db/supabase'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: workflowId } = await params

    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('workflow_id', workflowId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Workflow not found', 404)
      }
      throw error
    }

    // Check access (tenant or system-wide)
    if (data.tenant_id && data.tenant_id !== context.teamId) {
      return errorResponse('Forbidden', 403)
    }

    return successResponse(data)
  } catch (error: any) {
    console.error('Error fetching workflow:', error)
    return errorResponse(error.message || 'Failed to fetch workflow', 500)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: workflowId } = await params
    const body = await req.json()

    const supabase = await createServerSupabase()

    // Check if workflow exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('workflow_id', workflowId)
      .single()

    if (checkError || !existing) {
      return errorResponse('Workflow not found', 404)
    }

    if (existing.tenant_id && existing.tenant_id !== context.teamId) {
      return errorResponse('Forbidden', 403)
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.context_type !== undefined) updateData.context_type = body.context_type
    if (body.trigger_type !== undefined) updateData.trigger_type = body.trigger_type
    if (body.conditions !== undefined) updateData.conditions = body.conditions
    if (body.actions !== undefined) updateData.actions = body.actions
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from('workflow_definitions')
      .update(updateData)
      .eq('workflow_id', workflowId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return successResponse(data)
  } catch (error: any) {
    console.error('Error updating workflow:', error)
    return errorResponse(error.message || 'Failed to update workflow', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return errorResponse('Unauthorized', 401)
    }

    const { id: workflowId } = await params

    const supabase = await createServerSupabase()

    // Check if workflow exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('workflow_id', workflowId)
      .single()

    if (checkError || !existing) {
      return errorResponse('Workflow not found', 404)
    }

    if (existing.tenant_id && existing.tenant_id !== context.teamId) {
      return errorResponse('Forbidden', 403)
    }

    // Soft delete (set is_active = false)
    const { error } = await supabase
      .from('workflow_definitions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('workflow_id', workflowId)

    if (error) {
      throw error
    }

    return successResponse({ message: 'Workflow deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting workflow:', error)
    return errorResponse(error.message || 'Failed to delete workflow', 500)
  }
}
