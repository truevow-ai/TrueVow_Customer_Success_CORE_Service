/**
 * Render Communication Template API
 * 
 * POST /api/v1/communication-templates/[templateKey]/render - Render template with variables
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { CommunicationTemplatesService, TemplateRenderOptions } from '@/lib/services/communication-templates'
import { z } from 'zod'

const renderSchema = z.object({
  variables: z.record(z.any()).optional(),
  tenant_id: z.string().uuid().optional(),
}).strict()

export async function POST(
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
        const validation = await validateBody(req, renderSchema)
        if (!validation.success) {
          return validation.response
        }

        const template = await CommunicationTemplatesService.getTemplateByKey(
          templateKey,
          validation.data.tenant_id
        )

        if (!template) {
          return errorResponse('Template not found', 404)
        }

        const renderOptions: TemplateRenderOptions = validation.data.variables || {}

        const rendered = CommunicationTemplatesService.renderTemplate(template, renderOptions)

        return successResponse(rendered, 'Template rendered successfully')
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'Failed to render template',
          500
        )
      }
    })
  )(req)
}
