/**
 * AI Agent Guardrails API
 * 
 * GET /api/v1/ai-agents/guardrails - Get all agent guardrails
 * POST /api/v1/ai-agents/guardrails - Save guardrails configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { withTeamMember } from '@/lib/middleware/auth'
import { AIAgentGuardrailsService } from '@/lib/services/ai-agent-guardrails'
import { successResponse, errorResponse } from '@/lib/api/helpers'

export const GET = withTeamMember(async (req: NextRequest) => {
  try {
    // TODO: Fetch from database
    // For now, return default guardrails
    const defaultGuardrails = AIAgentGuardrailsService.getDefaultGuardrails('support_agent')
    
    return successResponse([defaultGuardrails])
  } catch (error: any) {
    return errorResponse('Failed to fetch guardrails', 500)
  }
})

export const POST = withTeamMember(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { agent_id, agent_name, guardrails } = body

    await AIAgentGuardrailsService.saveGuardrails({
      agent_id,
      agent_name,
      guardrails,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return successResponse({ message: 'Guardrails saved successfully' })
  } catch (error: any) {
    return errorResponse('Failed to save guardrails', 500)
  }
})
