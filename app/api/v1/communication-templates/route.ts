/**
 * Communication Templates API
 * 
 * GET /api/v1/communication-templates - List templates
 * POST /api/v1/communication-templates - Create template
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { CommunicationTemplatesService } from '@/lib/services/communication-templates'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db/supabase'

const listQuerySchema = z.object({
  sequence_template_key: z.string().optional(),
  template_type: z.enum(['email', 'sms', 'in_app', 'call_script']).optional(),
  category: z.string().optional(),
  is_active: z.string().transform(val => val === 'true').optional(),
})

const createTemplateSchema = z.object({
  template_key: z.string().min(1),
  template_name: z.string().min(1),
  description: z.string().optional(),
  template_type: z.enum(['email', 'sms', 'in_app', 'call_script']),
  category: z.string().optional(),
  sequence_template_key: z.string().optional(),
  milestone_key: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  body_html: z.string().optional(),
  variables: z.array(z.object({
    name: z.string(),
    key: z.string(),
    required: z.boolean(),
    description: z.string(),
    default_value: z.string().optional(),
  })).optional(),
  trigger_type: z.enum(['milestone', 'date_offset', 'manual', 'event']).optional(),
  trigger_milestone_key: z.string().optional(),
  trigger_days_offset: z.number().optional(),
  trigger_event: z.string().optional(),
  send_from_email: z.string().email().optional(),
  send_from_name: z.string().optional(),
  reply_to_email: z.string().email().optional(),
  send_conditions: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
}).strict()

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = {
        sequence_template_key: searchParams.get('sequence_template_key') || undefined,
        template_type: searchParams.get('template_type') as 'email' | 'sms' | 'in_app' | 'call_script' | undefined,
        category: searchParams.get('category') || undefined,
        is_active: searchParams.get('is_active') || undefined,
      }

      const validation = await validateBody({ json: async () => query }, listQuerySchema)
      if (!validation.success) {
        return validation.response
      }

      const supabase = createServerSupabase()
      const { data: teamMember } = await supabase
        .from('cs_team_members')
        .select('tenant_id')
        .eq('clerk_user_id', context.userId)
        .single()

      const tenantId = teamMember?.tenant_id || null

      let templates

      if (validation.data.sequence_template_key) {
        templates = await CommunicationTemplatesService.getTemplatesBySequence(
          validation.data.sequence_template_key,
          validation.data.template_type,
          tenantId || undefined
        )
      } else {
        // List all templates for tenant
        const { data, error } = await supabase
          .from('cs_communication_templates')
          .select('*')
          .eq('is_active', validation.data.is_active !== undefined ? validation.data.is_active : true)
          .or(tenantId ? `tenant_id.eq.${tenantId},tenant_id.is.null` : 'tenant_id.is.null')
          .order('created_at', { ascending: false })

        if (error) throw error
        templates = data.map(row => CommunicationTemplatesService['parseTemplate'](row))
      }

      // Filter by type and category if provided
      if (validation.data.template_type) {
        templates = templates.filter(t => t.template_type === validation.data.template_type)
      }
      if (validation.data.category) {
        templates = templates.filter(t => t.category === validation.data.category)
      }

      return successResponse(templates, 'Templates retrieved successfully')
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to retrieve templates',
        500
      )
    }
  })
)

export const POST = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const validation = await validateBody(req, createTemplateSchema)
      if (!validation.success) {
        return validation.response
      }

      const supabase = createServerSupabase()
      const { data: teamMember } = await supabase
        .from('cs_team_members')
        .select('tenant_id, user_id')
        .eq('clerk_user_id', context.userId)
        .single()

      const template = await CommunicationTemplatesService.createTemplate({
        ...validation.data,
        tenant_id: teamMember?.tenant_id || null,
        created_by: teamMember?.user_id || null,
      })

      return successResponse(template, 'Template created successfully', 201)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to create template',
        500
      )
    }
  })
)
