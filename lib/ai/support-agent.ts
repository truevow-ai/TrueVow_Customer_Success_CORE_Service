/**
 * Support Agent (AI)
 * 
 * AI-powered customer support agent that handles first-line support,
 * ticket triage, and common issue resolution
 */

import { AIAgentPromptsService, AgentContext } from '@/lib/services/ai-agent-prompts'
import { LLMProviderService, LLMResponse } from '@/lib/services/llm-provider'
import { createServerSupabase } from '@/lib/db/supabase'
import { TicketRepository } from '@/lib/repositories/tickets'

export interface SupportAgentResponse {
  response: string
  confidence: number
  shouldEscalate: boolean
  escalationReason?: string
  suggestedActions?: string[]
  kbArticles?: Array<{ title: string; link: string }>
}

export interface TicketAnalysis {
  category: 'technical' | 'billing' | 'account' | 'feature_request' | 'bug_report' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  complexity: 'simple' | 'moderate' | 'complex'
  serviceAffected: string
  customerStage: string
  confidence: number
  reasoning: string
}

export class SupportAgent {
  private systemPrompt: string

  constructor() {
    this.systemPrompt = AIAgentPromptsService.getSystemPrompt()
  }

  /**
   * Analyze a ticket and provide triage information
   */
  async analyzeTicket(context: AgentContext): Promise<TicketAnalysis> {
    const triagePrompt = AIAgentPromptsService.getTicketTriagePrompt(context)

    try {
      // Automatically uses configured priority order from LLM_PROVIDER_PRIORITY_ORDER env var
      const response = await LLMProviderService.generateResponse({
        systemPrompt: this.systemPrompt,
        userPrompt: triagePrompt,
        temperature: 0.3, // Lower temperature for more consistent analysis
        // No preferredProvider specified = uses configured priority order automatically
      })

      // Parse JSON response
      const analysis = JSON.parse(response.content) as TicketAnalysis
      return analysis
    } catch (error) {
      console.error('Error analyzing ticket:', error)
      // Return default analysis on error
      return {
        category: 'other',
        priority: 'medium',
        complexity: 'moderate',
        serviceAffected: 'Other',
        customerStage: 'post_sale',
        confidence: 0.5,
        reasoning: 'Analysis failed, defaulting to moderate priority',
      }
    }
  }

  /**
   * Generate a first response to a ticket
   */
  async generateFirstResponse(context: AgentContext): Promise<SupportAgentResponse> {
    const responsePrompt = AIAgentPromptsService.getFirstResponsePrompt(context)

    try {
      // Automatically uses configured priority order from LLM_PROVIDER_PRIORITY_ORDER env var
      const response = await LLMProviderService.generateResponse({
        systemPrompt: this.systemPrompt,
        userPrompt: responsePrompt,
        temperature: 0.7,
        maxTokens: 500,
        // No preferredProvider = uses configured priority order automatically
      })

      // Check if escalation is needed
      const escalationPrompt = AIAgentPromptsService.getEscalationDecisionPrompt(context)
      const escalationResponse = await LLMProviderService.generateResponse({
        systemPrompt: this.systemPrompt,
        userPrompt: escalationPrompt,
        temperature: 0.3,
        maxTokens: 200,
        // Automatically uses configured priority order
      })

      const shouldEscalate = escalationResponse.content.includes('ESCALATE')
      const escalationReason = shouldEscalate
        ? escalationResponse.content.split('Reasoning:')[1]?.trim()
        : undefined

      return {
        response: response.content,
        confidence: 0.8, // Could be calculated based on response quality
        shouldEscalate,
        escalationReason,
        suggestedActions: this.extractSuggestedActions(response.content),
        kbArticles: context.relevantArticles?.map(a => ({
          title: a.title,
          link: a.link,
        })),
      }
    } catch (error) {
      console.error('Error generating response:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  /**
   * Generate a response for a specific issue type
   */
  async generateIssueResponse(
    issueType: 'password_reset' | 'service_status' | 'feature_request' | 'billing',
    context: AgentContext
  ): Promise<SupportAgentResponse> {
    let prompt: string

    switch (issueType) {
      case 'password_reset':
        prompt = AIAgentPromptsService.getPasswordResetPrompt(context)
        break
      case 'service_status':
        prompt = AIAgentPromptsService.getServiceStatusPrompt(context)
        break
      case 'feature_request':
        prompt = AIAgentPromptsService.getFeatureRequestPrompt(context)
        break
      case 'billing':
        prompt = AIAgentPromptsService.getBillingQuestionPrompt(context)
        break
      default:
        prompt = AIAgentPromptsService.getFirstResponsePrompt(context)
    }

    try {
      // Automatically uses configured priority order
      const response = await LLMProviderService.generateResponse({
        systemPrompt: this.systemPrompt,
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 500,
        // No preferredProvider = uses configured priority order automatically
      })

      return {
        response: response.content,
        confidence: 0.85,
        shouldEscalate: issueType === 'billing', // Always escalate billing
        escalationReason: issueType === 'billing' ? 'Billing questions require account verification' : undefined,
      }
    } catch (error) {
      console.error(`Error generating ${issueType} response:`, error)
      throw new Error(`Failed to generate ${issueType} response`)
    }
  }

  /**
   * Generate a follow-up response
   */
  async generateFollowUpResponse(context: AgentContext): Promise<SupportAgentResponse> {
    const followUpPrompt = AIAgentPromptsService.getFollowUpResponsePrompt(context)

    try {
      // Automatically uses configured priority order
      const response = await LLMProviderService.generateResponse({
        systemPrompt: this.systemPrompt,
        userPrompt: followUpPrompt,
        temperature: 0.7,
        maxTokens: 500,
        // No preferredProvider = uses configured priority order automatically
      })

      return {
        response: response.content,
        confidence: 0.8,
        shouldEscalate: false,
      }
    } catch (error) {
      console.error('Error generating follow-up response:', error)
      throw new Error('Failed to generate follow-up response')
    }
  }

  /**
   * Generate escalation message
   */
  async generateEscalationMessage(context: AgentContext, reason: string): Promise<string> {
    const escalationPrompt = AIAgentPromptsService.getEscalationMessagePrompt(context, reason)

    try {
      // Automatically uses configured priority order
      const response = await LLMProviderService.generateResponse({
        systemPrompt: this.systemPrompt,
        userPrompt: escalationPrompt,
        temperature: 0.7,
        maxTokens: 300,
        // No preferredProvider = uses configured priority order automatically
      })

      return response.content
    } catch (error) {
      console.error('Error generating escalation message:', error)
      return `Your ticket has been escalated to our ${reason} team. They will respond within the next business day.`
    }
  }

  /**
   * Extract suggested actions from response text
   */
  private extractSuggestedActions(response: string): string[] {
    const actions: string[] = []
    
    // Look for numbered lists or bullet points
    const actionPatterns = [
      /(\d+\.\s+[^\n]+)/g,
      /(- [^\n]+)/g,
      /(• [^\n]+)/g,
    ]

    for (const pattern of actionPatterns) {
      const matches = response.match(pattern)
      if (matches) {
        actions.push(...matches.map(m => m.replace(/^\d+\.\s*|- |• /, '').trim()))
      }
    }

    return actions.slice(0, 5) // Limit to 5 actions
  }
}
