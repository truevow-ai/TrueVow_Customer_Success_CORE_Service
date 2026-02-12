/**
 * Hybrid Support Agent
 * 
 * Main agent that orchestrates Tier 1 (FAQ) + Tier 2 (LLM Enhancement) architecture.
 * 
 * Flow:
 * 1. Tier 1 (Rule-Based FAQ) searches for base response
 * 2. If match found, Tier 2 (LLM) enhances/refines the response
 * 3. Compliance validator ensures Bar-compliant output
 * 4. Structured response formatter creates final output
 */

import { Tier1FAQAgent, FAQSearchResult } from './tier1-faq-agent'
import { Tier2LLMEnhancer, EnhancedResponse, EnhancementContext } from './tier2-llm-enhancer'
import { ComplianceValidator } from '@/lib/middleware/compliance-validator'

export interface HybridAgentRequest {
  query: string
  tenantId?: string
  customerContext?: {
    customerEmail?: string
    customerName?: string
    practiceArea?: string
    healthScore?: number
  }
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  enableLLMEnhancement?: boolean // Default: true
}

export interface HybridAgentResponse {
  answer: string
  structured: {
    summary?: string
    steps?: string[]
    links?: Array<{ title: string; url: string }>
    nextSteps?: string[]
    escalationOffer?: string
  }
  confidence: number
  sources: {
    tier1: boolean
    llmEnhanced: boolean
    llmProvider?: string
  }
  compliance: {
    isValid: boolean
    flags: string[]
    requiresEscalation: boolean
  }
  metadata: {
    query: string
    tier1MatchType?: string
    processingTime: number
  }
}

export class HybridSupportAgent {
  /**
   * Process query through hybrid agent system
   */
  static async processQuery(
    request: HybridAgentRequest
  ): Promise<HybridAgentResponse> {
    const startTime = Date.now()
    const { query, tenantId, customerContext, conversationHistory, enableLLMEnhancement = true } = request

    // Check for immediate escalation triggers
    if (ComplianceValidator.requiresImmediateEscalation(query)) {
      return this.createEscalationResponse(query, startTime)
    }

    // Step 1: Tier 1 FAQ Agent (Rule-Based)
    const tier1Result = await Tier1FAQAgent.searchFAQ(query, tenantId)

    // If no Tier 1 match, return no-match response
    if (!tier1Result.hasMatch || !tier1Result.bestMatch) {
      return this.createNoMatchResponse(query, startTime)
    }

    const tier1Match = tier1Result.bestMatch
    const baseResponse = Tier1FAQAgent.getBaseResponse(tier1Match)

    // Step 2: Tier 2 LLM Enhancement (if enabled)
    let enhancedResponse: EnhancedResponse | null = null

    if (enableLLMEnhancement) {
      try {
        const enhancementContext: EnhancementContext = {
          query,
          tier1Match,
          customerContext,
          conversationHistory,
        }

        enhancedResponse = await Tier2LLMEnhancer.enhanceResponse(enhancementContext)
      } catch (error) {
        console.error('LLM enhancement failed, using Tier 1 only:', error)
        // Continue with Tier 1 response only
      }
    }

    // Step 3: Build final response
    const finalAnswer = enhancedResponse 
      ? enhancedResponse.answer 
      : baseResponse.answer

    // Step 4: Compliance validation
    const complianceResult = ComplianceValidator.validate(finalAnswer)

    // Step 5: Sanitize if needed
    let sanitizedAnswer = finalAnswer
    if (!complianceResult.isValid) {
      sanitizedAnswer = ComplianceValidator.sanitize(finalAnswer)
    }

    // Step 6: Add zero-knowledge reminder if missing
    if (!ComplianceValidator.hasZeroKnowledgeReminder(sanitizedAnswer.toLowerCase())) {
      sanitizedAnswer += ComplianceValidator.getZeroKnowledgeReminder()
    }

    // Step 7: Add escalation offer
    if (complianceResult.requiresEscalation || !tier1Result.hasMatch) {
      sanitizedAnswer += '\n\nWould you like me to connect you with your Customer Success Manager?'
    }

    const processingTime = Date.now() - startTime

    return {
      answer: sanitizedAnswer,
      structured: enhancedResponse?.structured || {},
      confidence: enhancedResponse?.confidence || baseResponse.confidence,
      sources: {
        tier1: true,
        llmEnhanced: enhancedResponse?.sources.llmEnhanced || false,
        llmProvider: enhancedResponse?.sources.llmProvider,
      },
      compliance: {
        isValid: complianceResult.isValid,
        flags: complianceResult.flags,
        requiresEscalation: complianceResult.requiresEscalation,
      },
      metadata: {
        query,
        tier1MatchType: tier1Match.matchType,
        processingTime,
      },
    }
  }

  /**
   * Create escalation response
   */
  private static createEscalationResponse(
    query: string,
    startTime: number
  ): HybridAgentResponse {
    return {
      answer: `I understand you have a question about compliance or legal matters. For your safety and to ensure Bar compliance, I'd like to connect you with your Customer Success Manager who can provide the appropriate guidance.\n\n${ComplianceValidator.getZeroKnowledgeReminder()}\n\nWould you like me to escalate this to your CSM?`,
      structured: {
        escalationOffer: 'Would you like me to escalate this to your CSM?',
      },
      confidence: 1.0,
      sources: {
        tier1: false,
        llmEnhanced: false,
      },
      compliance: {
        isValid: true,
        flags: ['IMMEDIATE_ESCALATION_REQUIRED'],
        requiresEscalation: true,
      },
      metadata: {
        query,
        processingTime: Date.now() - startTime,
      },
    }
  }

  /**
   * Create no-match response
   */
  private static createNoMatchResponse(
    query: string,
    startTime: number
  ): HybridAgentResponse {
    return {
      answer: `I couldn't find a specific answer to your question in our knowledge base. ${ComplianceValidator.getZeroKnowledgeReminder()}\n\nWould you like me to connect you with your Customer Success Manager who can help?`,
      structured: {
        escalationOffer: 'Would you like me to connect you with your Customer Success Manager?',
      },
      confidence: 0.0,
      sources: {
        tier1: false,
        llmEnhanced: false,
      },
      compliance: {
        isValid: true,
        flags: ['NO_TIER1_MATCH'],
        requiresEscalation: true,
      },
      metadata: {
        query,
        processingTime: Date.now() - startTime,
      },
    }
  }
}
