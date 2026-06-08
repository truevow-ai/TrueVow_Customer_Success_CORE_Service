/**
 * Compliance Safety Layer
 * 
 * Validates responses for Bar-compliant, zero-knowledge legal SaaS requirements.
 * Blocks unsafe phrases and ensures compliance.
 */

export interface ComplianceResult {
  isValid: boolean
  flags: string[]
  blockedPhrases: string[]
  requiresEscalation: boolean
}

export class ComplianceValidator {
  // Blocked phrases that indicate legal advice or unsupported claims
  private static readonly BLOCKED_PHRASES = [
    // Legal advice indicators
    'you should file',
    'you should sue',
    'your case is worth',
    'file a motion',
    'you need to',
    'you must',
    'legally required',
    'legal obligation',
    
    // Data speculation
    'we can see your',
    'we have access to your',
    'we store your',
    'we record your',
    'we track your',
    
    // Unsupported promises
    'guaranteed',
    'will definitely',
    'promise you',
    'assure you',
  ]

  // Compliance trigger words that require escalation
  private static readonly ESCALATION_TRIGGERS = [
    'bar',
    'audit',
    'malpractice',
    'client data',
    'phi',
    'protected health',
    'confidential',
    'attorney-client',
    'privilege',
  ]

  /**
   * Validate response for compliance
   */
  static validate(response: string): ComplianceResult {
    const normalizedResponse = response.toLowerCase()
    const flags: string[] = []
    const blockedPhrases: string[] = []
    let requiresEscalation = false

    // Check for blocked phrases
    for (const phrase of this.BLOCKED_PHRASES) {
      if (normalizedResponse.includes(phrase)) {
        blockedPhrases.push(phrase)
        flags.push(`BLOCKED_PHRASE: ${phrase}`)
      }
    }

    // Check for escalation triggers
    for (const trigger of this.ESCALATION_TRIGGERS) {
      if (normalizedResponse.includes(trigger)) {
        requiresEscalation = true
        flags.push(`ESCALATION_TRIGGER: ${trigger}`)
      }
    }

    // Check for zero-knowledge reminder
    if (!this.hasZeroKnowledgeReminder(normalizedResponse)) {
      flags.push('MISSING_ZERO_KNOWLEDGE_REMINDER')
    }

    return {
      isValid: blockedPhrases.length === 0 && !requiresEscalation,
      flags,
      blockedPhrases,
      requiresEscalation,
    }
  }

  /**
   * Check if response has zero-knowledge reminder
   */
  private static hasZeroKnowledgeReminder(response: string): boolean {
    const reminders = [
      'zero-knowledge',
      'zero knowledge',
      "don't store",
      'do not store',
      'no recordings',
      'no transcripts',
      'never record',
      'never store',
    ]

    return reminders.some(reminder => response.includes(reminder))
  }

  /**
   * Get standard zero-knowledge reminder
   */
  static getZeroKnowledgeReminder(): string {
    return `\n\n**Important:** TrueVow operates on a zero-knowledge principle. We don't store call recordings or transcripts, ensuring your client communications remain private and Bar-compliant.`
  }

  /**
   * Sanitize response by replacing unsafe phrases
   */
  static sanitize(response: string): string {
    let sanitized = response

    // Replace data speculation phrases
    sanitized = sanitized.replace(
      /we can see your/gi,
      'Based on your settings'
    )
    sanitized = sanitized.replace(
      /we have access to your/gi,
      'Based on your configuration'
    )
    sanitized = sanitized.replace(
      /we store your/gi,
      'Your settings indicate'
    )

    // Add zero-knowledge reminder if missing
    if (!this.hasZeroKnowledgeReminder(sanitized.toLowerCase())) {
      sanitized += this.getZeroKnowledgeReminder()
    }

    return sanitized
  }

  /**
   * Check if query requires immediate escalation
   */
  static requiresImmediateEscalation(query: string): boolean {
    const normalizedQuery = query.toLowerCase()
    return this.ESCALATION_TRIGGERS.some(trigger => 
      normalizedQuery.includes(trigger)
    )
  }
}
