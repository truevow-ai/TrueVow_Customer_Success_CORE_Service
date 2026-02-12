/**
 * Input Sanitization Utilities
 * Prevents injection attacks and malicious input
 */

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // Remove control characters (except newlines and tabs for text content)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

  return sanitized
}

/**
 * Sanitize string input (alias for backward compatibility)
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  return sanitizeString(input, maxLength)
}

/**
 * Sanitize UUID
 */
export function sanitizeUUID(input: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(input)) {
    throw new Error('Invalid UUID format')
  }
  return input.toLowerCase()
}

/**
 * Sanitize email
 */
export function sanitizeEmail(input: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = sanitizeString(input, 255)
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }
  return sanitized.toLowerCase()
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')
  
  // Validate length (10-15 digits for international)
  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Invalid phone number format')
  }
  
  return digits
}

/**
 * Sanitize object (recursively sanitize strings)
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, maxDepth: number = 10): T {
  if (maxDepth <= 0) {
    throw new Error('Maximum recursion depth exceeded')
  }

  const sanitized = {} as T

  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const sanitizedKey = sanitizeString(key, 100)

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value) as any
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      ) as any
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value, maxDepth - 1) as any
    } else {
      sanitized[sanitizedKey] = value
    }
  }

  return sanitized
}

/**
 * Validate and sanitize ticket ID
 */
export function validateTicketId(ticketId: unknown): string {
  if (typeof ticketId !== 'string') {
    throw new Error('Ticket ID must be a string')
  }
  return sanitizeUUID(ticketId)
}

/**
 * Validate action type
 */
export function validateAction(action: unknown): 'create' | 'update' | 'sync_all' {
  if (typeof action !== 'string') {
    throw new Error('Action must be a string')
  }
  
  const validActions = ['create', 'update', 'sync_all']
  if (!validActions.includes(action)) {
    throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`)
  }
  
  return action as 'create' | 'update' | 'sync_all'
}

/**
 * Check for SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(--|\#|\/\*|\*\/|;)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check for XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<img[^>]+src[^>]*=.*javascript:/i,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Check for command injection patterns
 */
export function detectCommandInjection(input: string): boolean {
  const commandPatterns = [
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mkdir|cd|chmod|chown)\b/i,
    /(\$\{|\$\(|`)/,
  ]
  
  return commandPatterns.some(pattern => pattern.test(input))
}

/**
 * Comprehensive input validation
 */
export function validateInput(input: string, type: 'text' | 'uuid' | 'email' | 'phone' = 'text'): string {
  // Check for injection patterns
  if (detectSQLInjection(input)) {
    throw new Error('Potential SQL injection detected')
  }
  
  if (detectXSS(input)) {
    throw new Error('Potential XSS attack detected')
  }
  
  if (detectCommandInjection(input)) {
    throw new Error('Potential command injection detected')
  }

  // Type-specific validation
  switch (type) {
    case 'uuid':
      return sanitizeUUID(input)
    case 'email':
      return sanitizeEmail(input)
    case 'phone':
      return sanitizePhone(input)
    default:
      return sanitizeString(input)
  }
}
