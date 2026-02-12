/**
 * AI Agent Prompts Service
 * 
 * Provides prompt templates and generation for AI support agents
 * Based on the design in docs/AI_AGENT_PROMPTS_DESIGN.md
 */

export interface AgentContext {
  ticketId?: string
  subject?: string
  description?: string
  channel?: string
  customerName?: string
  customerEmail?: string
  accountStatus?: string
  activeServices?: string[]
  recentTicketsCount?: number
  healthScore?: number
  tenantName?: string
  serviceStatus?: Record<string, any>
  knownIssues?: string[]
  maintenanceSchedule?: string
  similarTickets?: Array<{ id: string; subject: string; resolution: string }>
  relevantArticles?: Array<{ id: string; title: string; summary: string; link: string }>
  conversationHistory?: Array<{ role: 'agent' | 'customer'; message: string; timestamp: string }>
}

export interface TicketAnalysis {
  category: 'technical' | 'billing' | 'account' | 'feature_request' | 'bug_report' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  complexity: 'simple' | 'moderate' | 'complex'
  serviceAffected: 'INTAKE' | 'DRAFT' | 'SETTLE' | 'VERIFY' | 'CONNECT' | 'Platform' | 'Other'
  customerStage: 'pre_sale' | 'post_sale' | 'retention'
  confidence: number
  reasoning: string
}

export class AIAgentPromptsService {
  /**
   * Generate system prompt for Support Agent
   */
  static getSystemPrompt(): string {
    return `You are a Customer Support Agent for TrueVow, a legal technology platform serving law firms.

**Your Role:**
- Provide first-line support to law firm customers
- Triage and categorize support tickets
- Resolve common issues independently
- Escalate complex issues to human agents
- Suggest relevant knowledge base articles
- Maintain professional, empathetic communication

**Your Capabilities:**
- Access to knowledge base articles
- Ticket history and customer context
- Service status information
- Common issue resolution patterns

**Your Limitations:**
- Cannot access billing information directly (must escalate)
- Cannot make account changes (must escalate)
- Cannot access sensitive customer data without authorization
- Must escalate security-related issues immediately

**Communication Guidelines:**
- Use clear, professional language
- Avoid legal jargon unless customer uses it
- Be empathetic to customer frustrations
- Provide step-by-step instructions when helpful
- Acknowledge when you don't know something
- Always offer to escalate if needed

**Response Format:**
- Start with acknowledgment of the issue
- Provide clear explanation or solution
- Include relevant KB article links if applicable
- End with next steps or escalation offer`
  }

  /**
   * Generate ticket triage prompt
   */
  static getTicketTriagePrompt(context: AgentContext): string {
    return `Analyze this support ticket and determine:

1. **Category:** Technical, Billing, Account, Feature Request, Bug Report, Other
2. **Priority:** Low, Medium, High, Urgent
3. **Complexity:** Simple (can resolve), Moderate (needs investigation), Complex (needs escalation)
4. **Service Affected:** INTAKE, DRAFT, SETTLE, VERIFY, CONNECT, Platform, Other
5. **Customer Stage:** Pre-sale, Post-sale, Retention

**Ticket Details:**
- Subject: ${context.subject || 'N/A'}
- Description: ${context.description || 'N/A'}
- Channel: ${context.channel || 'N/A'}
- Customer: ${context.customerName || 'N/A'}
- Tenant: ${context.tenantName || 'N/A'}

**Customer Context:**
- Account Status: ${context.accountStatus || 'N/A'}
- Services Active: ${context.activeServices?.join(', ') || 'N/A'}
- Recent Tickets: ${context.recentTicketsCount || 0}
- Health Score: ${context.healthScore || 'N/A'}

Provide your analysis in JSON format:
{
  "category": "...",
  "priority": "...",
  "complexity": "...",
  "service_affected": "...",
  "customer_stage": "...",
  "confidence": 0.0-1.0,
  "reasoning": "..."
}`
  }

  /**
   * Generate first response prompt
   */
  static getFirstResponsePrompt(context: AgentContext): string {
    const kbArticles = context.relevantArticles?.map(a => 
      `- ${a.title}: ${a.summary} (${a.link})`
    ).join('\n') || 'None available'

    const similarTickets = context.similarTickets?.map(t => 
      `- ${t.subject}: ${t.resolution}`
    ).join('\n') || 'None found'

    return `Generate a first response to this support ticket.

**Ticket:**
- Subject: ${context.subject || 'N/A'}
- Description: ${context.description || 'N/A'}
- Channel: ${context.channel || 'N/A'}
- Priority: ${context.priority || 'medium'}

**Customer:**
- Name: ${context.customerName || 'N/A'}
- Account: ${context.tenantName || 'N/A'}
- Services: ${context.activeServices?.join(', ') || 'N/A'}

**Context:**
- Similar tickets: ${similarTickets}
- KB articles: ${kbArticles}
- Service status: ${JSON.stringify(context.serviceStatus || {})}

**Response Requirements:**
1. Acknowledge the issue clearly
2. Show empathy if customer is frustrated
3. Provide solution or next steps
4. Include relevant KB links
5. Offer additional help
6. Professional, friendly tone
7. Keep under 200 words if possible

Generate the response.`
  }

  /**
   * Generate password reset response prompt
   */
  static getPasswordResetPrompt(context: AgentContext): string {
    return `The customer is requesting a password reset.

**Response Guidelines:**
1. Acknowledge the request
2. Explain that password resets are handled via the login page
3. Provide clear instructions:
   - Go to login page
   - Click "Forgot Password"
   - Enter email address
   - Check email for reset link
4. If customer says they didn't receive email:
   - Check spam folder
   - Verify email address is correct
   - Offer to escalate if still not received
5. End with offer to help with anything else

**Customer:** ${context.customerName || 'Customer'}
**Email:** ${context.customerEmail || 'N/A'}

Generate a helpful, clear response.`
  }

  /**
   * Generate service status inquiry prompt
   */
  static getServiceStatusPrompt(context: AgentContext): string {
    const knownIssues = context.knownIssues?.join('\n') || 'None'
    const maintenance = context.maintenanceSchedule || 'None scheduled'

    return `The customer is asking about service status or experiencing issues.

**Available Information:**
- Service Status: ${JSON.stringify(context.serviceStatus || {})}
- Known Issues: ${knownIssues}
- Maintenance Schedule: ${maintenance}

**Response Guidelines:**
1. Check if there's a known issue affecting the customer
2. If yes: Acknowledge, explain, provide ETA if available
3. If no: Ask for more details about the issue
4. Provide relevant KB articles if applicable
5. Offer to escalate if issue persists

**Customer Issue:** ${context.description || 'N/A'}
**Service:** ${context.activeServices?.[0] || 'N/A'}

Generate an appropriate response.`
  }

  /**
   * Generate feature request response prompt
   */
  static getFeatureRequestPrompt(context: AgentContext): string {
    return `The customer is requesting a new feature or enhancement.

**Response Guidelines:**
1. Thank them for the feedback
2. Acknowledge the request
3. Explain that feature requests are reviewed by the product team
4. Offer to create a feature request ticket
5. Provide timeline expectations (if available)
6. Ask if there's a workaround that would help in the meantime

**Feature Request:** ${context.description || 'N/A'}
**Service:** ${context.activeServices?.[0] || 'N/A'}

Generate a professional, appreciative response.`
  }

  /**
   * Generate billing question response prompt
   */
  static getBillingQuestionPrompt(context: AgentContext): string {
    return `The customer has a billing-related question.

**IMPORTANT:** You cannot access billing information directly. You must:
1. Acknowledge the question
2. Explain that billing questions require account verification
3. Offer to escalate to billing team
4. Provide general information if appropriate (pricing tiers, billing cycles)
5. Never provide specific account balance or payment details

**Question:** ${context.description || 'N/A'}
**Customer:** ${context.customerName || 'Customer'}

Generate a helpful response that offers escalation.`
  }

  /**
   * Generate KB article suggestion prompt
   */
  static getKBArticleSuggestionPrompt(context: AgentContext): string {
    const articles = context.relevantArticles?.map(a => 
      `- ${a.title}: ${a.summary} (${a.link})`
    ).join('\n') || 'None available'

    return `The customer has a question that might be answered by a knowledge base article.

**Available KB Articles:**
${articles}

**Question:** ${context.description || 'N/A'}

**Response Guidelines:**
1. Acknowledge the question
2. Suggest the most relevant KB article(s)
3. Provide a brief summary of what the article covers
4. Include direct link to article
5. Ask if the article helps or if they need more assistance

Generate a response that includes:
- Article title
- Brief description
- Direct link
- Offer for additional help`
  }

  /**
   * Generate escalation decision prompt
   */
  static getEscalationDecisionPrompt(context: AgentContext): string {
    return `Determine if this ticket should be escalated to a human agent.

**Escalation Triggers:**
- Billing issues (always escalate)
- Account security concerns (always escalate)
- Complex technical issues beyond your knowledge
- Customer explicitly requests human agent
- Customer is frustrated or upset
- Issue affects multiple customers
- Service outage or critical bug

**Ticket Details:**
- Subject: ${context.subject || 'N/A'}
- Description: ${context.description || 'N/A'}
- Category: ${context.category || 'N/A'}
- Priority: ${context.priority || 'medium'}

**Decision:** ESCALATE | HANDLE | NEEDS_MORE_INFO

Provide reasoning.`
  }

  /**
   * Generate escalation message prompt
   */
  static getEscalationMessagePrompt(context: AgentContext, reason: string): string {
    return `This ticket is being escalated to a human agent.

**Escalation Reason:** ${reason}
**Ticket Summary:** ${context.subject || 'N/A'}
**Customer Context:** ${context.customerName || 'Customer'} - ${context.tenantName || 'Account'}
**Attempted Solutions:** ${context.description || 'Initial triage'}

Generate a message to the customer explaining:
1. That their ticket is being escalated
2. Why it's being escalated
3. What to expect next
4. Estimated response time
5. Ticket number for reference

Keep it professional and reassuring.`
  }

  /**
   * Generate follow-up response prompt
   */
  static getFollowUpResponsePrompt(context: AgentContext): string {
    const history = context.conversationHistory?.map(msg => 
      `${msg.role}: ${msg.message}`
    ).join('\n') || 'No previous messages'

    return `Generate a follow-up response to this ongoing ticket.

**Previous Messages:**
${history}

**Current Status:**
- Ticket Status: ${context.status || 'open'}
- Last Update: ${context.lastUpdate || 'N/A'}

**New Information:**
${context.description || 'N/A'}

**Response Guidelines:**
1. Reference previous conversation
2. Provide update on status
3. Answer any new questions
4. Provide next steps
5. Maintain continuity with previous messages

Generate the follow-up response.`
  }
}
