/**
 * Communication Template by Key API
 * 
 * GET /api/v1/communication-templates/[templateKey] - Get template by key
 * PUT /api/v1/communication-templates/[templateKey] - Update template
 * DELETE /api/v1/communication-templates/[templateKey] - Delete template (soft delete)
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { CommunicationTemplatesService } from '@/lib/services/communication-templates'
import { z } from 'zod'

const updateTemplateSchema = z.object({
  template_name: z.string().min(1).optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1).optional(),
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

export async function GET(
  req: NextRequest,
  { params }: { params: { templateKey: string } }
) {
  return withRateLimit(
    {
      windowMs: 60 * 1000,
      maxRequests: 30,
    },
    withTeamMember(async (req: NextRequest, context) => {
      try {
        const { templateKey } = params
        const { searchParams } = new URL(req.url)
        const tenantId = searchParams.get('tenant_id') || undefined

        const template = await CommunicationTemplatesService.getTemplateByKey(
          templateKey,
          tenantId
        )

        if (!template) {
          return errorResponse('Template not found', 404)
        }

        return successResponse(template, 'Template retrieved successfully')
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'Failed to retrieve template',
          500
        )
      }
    })
  )(req)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { templateKey: string } }
) {
  return withRateLimit(
    {
      windowMs: 60 * 1000,
      maxRequests: 10,
    },
    withTeamMember(async (req: NextRequest, context) => {
      try {
        const { templateKey } = params
        const validation = await validateBody(req, updateTemplateSchema)
        if (!validation.success) {
          return validation.response
        }

        const template = await CommunicationTemplatesService.updateTemplate(
          templateKey,
          validation.data
        )

        return successResponse(template, 'Template updated successfully')
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'Failed to update template',
          500
        )
      }
    })
  )(req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateKey: string } }
) {
  return withRateLimit(
    {
      windowMs: 60 * 1000,
      maxRequests: 10,
    },
    withTeamMember(async (req: NextRequest, context) => {
      try {
        const { templateKey } = params

        await CommunicationTemplatesService.deleteTemplate(templateKey)

        return successResponse(null, 'Template deleted successfully')
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'Failed to delete template',
          500
        )
      }
    })
  )(req)
}
