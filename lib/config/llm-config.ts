/**
 * LLM Provider Configuration
 * 
 * Manages LLM provider priority order and settings
 */

export type LLMProvider = 'anthropic' | 'openai' | 'grok'

export interface LLMConfig {
  priorityOrder: LLMProvider[]
  defaultModel: Record<LLMProvider, string>
  defaultTemperature: Record<LLMProvider, number>
  defaultMaxTokens: Record<LLMProvider, number>
}

/**
 * Get LLM provider priority order from environment or use default
 */
export function getLLMProviderPriorityOrder(): LLMProvider[] {
  // Check for explicit configuration
  const envOrder = process.env.LLM_PROVIDER_PRIORITY_ORDER
  
  if (envOrder) {
    const providers = envOrder.split(',').map(p => p.trim().toLowerCase()) as LLMProvider[]
    // Validate providers
    const validProviders: LLMProvider[] = ['anthropic', 'openai', 'grok']
    const filtered = providers.filter(p => validProviders.includes(p))
    
    if (filtered.length > 0) {
      return filtered
    }
  }

  // Default priority order: Anthropic → OpenAI → Grok
  return ['anthropic', 'openai', 'grok']
}

/**
 * Get default model for provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  const models: Record<LLMProvider, string> = {
    anthropic: 'claude-3-5-sonnet-20241022',
    openai: 'gpt-4-turbo-preview',
    grok: 'grok-beta',
  }

  // Allow override via environment
  const envKey = `${provider.toUpperCase()}_MODEL`
  return process.env[envKey] || models[provider]
}

/**
 * Get default temperature for provider
 */
export function getDefaultTemperature(provider: LLMProvider): number {
  const temperatures: Record<LLMProvider, number> = {
    anthropic: 0.7,
    openai: 0.7,
    grok: 0.7,
  }

  // Allow override via environment
  const envKey = `${provider.toUpperCase()}_TEMPERATURE`
  return envKey in process.env ? parseFloat(process.env[envKey]!) : temperatures[provider]
}

/**
 * Get default max tokens for provider
 */
export function getDefaultMaxTokens(provider: LLMProvider): number {
  const maxTokens: Record<LLMProvider, number> = {
    anthropic: 4096,
    openai: 4096,
    grok: 4096,
  }

  // Allow override via environment
  const envKey = `${provider.toUpperCase()}_MAX_TOKENS`
  return envKey in process.env ? parseInt(process.env[envKey]!) : maxTokens[provider]
}

/**
 * Get complete LLM configuration
 */
export function getLLMConfig(): LLMConfig {
  const priorityOrder = getLLMProviderPriorityOrder()
  
  return {
    priorityOrder,
    defaultModel: {
      anthropic: getDefaultModel('anthropic'),
      openai: getDefaultModel('openai'),
      grok: getDefaultModel('grok'),
    },
    defaultTemperature: {
      anthropic: getDefaultTemperature('anthropic'),
      openai: getDefaultTemperature('openai'),
      grok: getDefaultTemperature('grok'),
    },
    defaultMaxTokens: {
      anthropic: getDefaultMaxTokens('anthropic'),
      openai: getDefaultMaxTokens('openai'),
      grok: getDefaultMaxTokens('grok'),
    },
  }
}
