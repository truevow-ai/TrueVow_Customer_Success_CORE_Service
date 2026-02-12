/**
 * Hybrid Support Agent API
 * 
 * POST /api/v1/ai/hybrid-support
 * 
 * Processes queries through Tier 1 (Rule-Based FAQ) + Tier 2 (LLM Enhancement) architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { HybridSupportAgent, HybridAgentRequest } from '@/lib/ai/hybrid-support-agent'
import { z } from 'zod'

const hybridSupportSchema = z.object({
  query: z.string().min(1).max(1000),
  tenant_id: z.string().uuid().optional(),
  customer_context: z.object({
    customer_email: z.string().email().optional(),
    customer_name: z.string().optional(),
    practice_area: z.string().optional(),
    health_score: z.number().min(0).max(100).optional(),
  }).optional(),
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  enable_llm_enhancement: z.boolean().optional().default(true),
})

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth()
    if (!context.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = hybridSupportSchema.parse(body)

    // Build request (map snake_case API to camelCase agent)
    const request: HybridAgentRequest = {
      query: validated.query,
      tenantId: validated.tenant_id,
      customerContext: validated.customer_context
        ? {
            customerEmail: validated.customer_context.customer_email,
            customerName: validated.customer_context.customer_name,
            practiceArea: validated.customer_context.practice_area,
            healthScore: validated.customer_context.health_score,
          }
        : undefined,
      conversationHistory: validated.conversation_history,
      enableLLMEnhancement: validated.enable_llm_enhancement,
    }

    // Process through hybrid agent
    const response = await HybridSupportAgent.processQuery(request)

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error: any) {
    console.error('Hybrid support agent error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process query', details: error.message },
      { status: 500 }
    )
  }
}
