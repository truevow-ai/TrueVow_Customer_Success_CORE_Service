/**
 * Tier 2: LLM Enhancement Agent
 * 
 * Augments and refines Tier 1 FAQ responses using LLM with strict guardrails.
 * This is called AFTER Tier 1 finds a base response.
 * 
 * Features:
 * - Multi-LLM provider support (Anthropic, OpenAI, Grok, Qwen, Kimi)
 * - Strict compliance guardrails
 * - Response refinement and personalization
 * - Structured output formatting
 */

import { LLMProviderService } from '@/lib/services/llm-provider'
import { ComplianceValidator } from '@/lib/middleware/compliance-validator'
import { FAQMatch } from './tier1-faq-agent'

export interface EnhancedResponse {
  answer: string
  structured: {
    summary?: string
    steps?: string[]
    links?: Array<{ title: string; url: string }>
    nextSteps?: string[]
    escalationOffer?: string
  }
  confidence: number
  complianceFlags: string[]
  zeroKnowledgeReminder: string
  sources: {
    tier1: boolean
    llmEnhanced: boolean
    llmProvider?: string
  }
}

export interface EnhancementContext {
  query: string
  tier1Match: FAQMatch
  customerContext?: {
    tenantId?: string
    customerEmail?: string
    customerName?: string
    practiceArea?: string
    healthScore?: number
  }
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export class Tier2LLMEnhancer {
  /**
   * Enhance Tier 1 response with LLM
   */
  static async enhanceResponse(
    context: EnhancementContext
  ): Promise<EnhancedResponse> {
    const { query, tier1Match, customerContext, conversationHistory } = context

    // Build enhancement prompt with strict guardrails
    const enhancementPrompt = this.buildEnhancementPrompt(
      query,
      tier1Match,
      customerContext
    )

    // Get system prompt with compliance guardrails
    const systemPrompt = this.getSystemPrompt()

    try {
      // Use LLM provider service (automatically uses configured priority order)
      const llmResponse = await LLMProviderService.generateResponse({
        systemPrompt,
        userPrompt: enhancementPrompt,
        temperature: 0.3, // Lower temperature for more consistent, safer responses
        maxTokens: 800,
        // No preferredProvider = uses configured priority order automatically
      })

      // Parse structured response
      const structured = this.parseStructuredResponse(llmResponse.content)

      // Validate compliance
      const complianceResult = ComplianceValidator.validate(llmResponse.content)

      // Build enhanced response
      const enhancedAnswer = this.buildEnhancedAnswer(
        tier1Match.answer,
        llmResponse.content,
        structured
      )

      return {
        answer: enhancedAnswer,
        structured,
        confidence: Math.min(tier1Match.confidence + 0.1, 1.0), // Slightly increase confidence
        complianceFlags: complianceResult.flags,
        zeroKnowledgeReminder: ComplianceValidator.getZeroKnowledgeReminder(),
        sources: {
          tier1: true,
          llmEnhanced: true,
          llmProvider: llmResponse.provider,
        },
      }
    } catch (error) {
      console.error('LLM enhancement failed:', error)
      
      // Fallback to Tier 1 response only
      return {
        answer: tier1Match.answer,
        structured: {},
        confidence: tier1Match.confidence,
        complianceFlags: [],
        zeroKnowledgeReminder: ComplianceValidator.getZeroKnowledgeReminder(),
        sources: {
          tier1: true,
          llmEnhanced: false,
        },
      }
    }
  }

  /**
   * Build enhancement prompt with guardrails
   */
  private static buildEnhancementPrompt(
    query: string,
    tier1Match: FAQMatch,
    customerContext?: EnhancementContext['customerContext']
  ): string {
    return `You are a customer support assistant for TrueVow, a legal technology platform serving law firms.

**CRITICAL RULES:**
1. NEVER provide legal advice
2. NEVER make unsupported promises
3. NEVER speculate about customer data ("We can see your calls..." → "Based on your settings...")
4. ALWAYS include zero-knowledge reminder
5. ALWAYS offer human escalation for complex issues

**TASK:**
Enhance the following FAQ answer to be more helpful, clear, and personalized while maintaining compliance.

**Original Question:** ${query}

**Base FAQ Answer:**
${tier1Match.answer}

**Customer Context:** ${customerContext ? JSON.stringify(customerContext, null, 2) : 'None provided'}

**Enhancement Guidelines:**
1. Keep the core answer accurate and unchanged
2. Add clarity and structure (steps, links, next actions)
3. Personalize tone for law firm context
4. Add relevant links or resources if applicable
5. End with escalation offer: "Would you like me to connect you with your Customer Success Manager?"

**Output Format (JSON):**
{
  "enhanced_answer": "Enhanced answer text",
  "summary": "One-sentence summary",
  "steps": ["Step 1", "Step 2", ...],
  "links": [{"title": "Link Title", "url": "https://..."}],
  "next_steps": ["Action 1", "Action 2"],
  "escalation_offer": "Would you like me to connect you with your Customer Success Manager?"
}

**IMPORTANT:** Your response must be valid JSON only, no markdown formatting.`
  }

  /**
   * Get system prompt with compliance guardrails
   */
  private static getSystemPrompt(): string {
    return `You are a customer support assistant for TrueVow, a legal technology platform.

**Your Role:**
- Enhance FAQ answers to be more helpful and clear
- Maintain Bar-compliant, zero-knowledge principles
- Never provide legal advice
- Never make unsupported promises

**Compliance Requirements:**
- Zero-knowledge: "We don't store recordings or transcripts"
- No legal advice: Never interpret legal scenarios
- No data speculation: Use "Based on your settings" not "We can see your data"
- Always offer human escalation

**Response Style:**
- Professional but friendly
- Clear and concise
- Structured with steps when helpful
- Empathetic to law firm workloads

**Output:**
- Always return valid JSON
- Include zero-knowledge reminder
- Offer escalation for complex issues`
  }

  /**
   * Parse structured response from LLM
   */
  private static parseStructuredResponse(content: string): EnhancedResponse['structured'] {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: parsed.summary,
          steps: Array.isArray(parsed.steps) ? parsed.steps : undefined,
          links: Array.isArray(parsed.links) ? parsed.links : undefined,
          nextSteps: Array.isArray(parsed.next_steps) ? parsed.next_steps : undefined,
          escalationOffer: parsed.escalation_offer,
        }
      }
    } catch (error) {
      console.error('Failed to parse structured response:', error)
    }

    return {}
  }

  /**
   * Build final enhanced answer combining Tier 1 and LLM enhancement
   */
  private static buildEnhancedAnswer(
    tier1Answer: string,
    llmContent: string,
    structured: EnhancedResponse['structured']
  ): string {
    // Extract enhanced answer from LLM response
    let enhancedAnswer = tier1Answer

    try {
      const jsonMatch = llmContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.enhanced_answer) {
          enhancedAnswer = parsed.enhanced_answer
        }
      }
    } catch (error) {
      // Fallback to Tier 1 answer if parsing fails
      console.error('Failed to extract enhanced answer:', error)
    }

    // Add structured elements if available
    if (structured.steps && structured.steps.length > 0) {
      enhancedAnswer += '\n\n**Steps:**\n' + structured.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    }

    if (structured.links && structured.links.length > 0) {
      enhancedAnswer += '\n\n**Resources:**\n' + structured.links.map(l => `- [${l.title}](${l.url})`).join('\n')
    }

    if (structured.nextSteps && structured.nextSteps.length > 0) {
      enhancedAnswer += '\n\n**Next Steps:**\n' + structured.nextSteps.map(s => `- ${s}`).join('\n')
    }

    return enhancedAnswer
  }
}
