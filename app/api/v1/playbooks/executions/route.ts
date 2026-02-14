/**
 * Playbook Executions API
 * 
 * GET /api/v1/playbooks/executions?tenant_id=...&playbook_id=...&status=...
 * Get playbook executions
 */

import { NextRequest } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { successResponse, errorResponse } from '@/lib/api/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { validateInput } from '@/lib/utils/input-sanitization'
import { SuccessPlaybooksService } from '@/lib/services/success-playbooks'

export const GET = withRateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  withTeamMember(async (req: NextRequest, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const tenantIdParam = searchParams.get('tenant_id')
      const playbookIdParam = searchParams.get('playbook_id')
      const statusParam = searchParams.get('status')

      const tenantId = tenantIdParam ? validateInput(tenantIdParam, 'uuid') : undefined
      const playbookId = playbookIdParam ? validateInput(playbookIdParam, 'uuid') : undefined
      const status = statusParam || undefined

      const executions = await SuccessPlaybooksService.getExecutions(tenantId, playbookId, status)

      return successResponse(executions)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to get executions',
        500
      )
    }
  })
)



