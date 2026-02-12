# LLM Provider Priority Configuration

**Date:** January 15, 2026  
**Status:** ✅ Complete  
**Feature:** Configurable LLM Provider Priority Order

---

## Overview

The Support Agent now automatically uses available LLM providers based on a configurable priority order. This ensures optimal provider selection while maintaining high availability through automatic fallback.

---

## Configuration

### Environment Variable

Set the priority order via environment variable:

```bash
# Priority order: Try OpenAI first, then Grok, then Anthropic
LLM_PROVIDER_PRIORITY_ORDER=openai,grok,anthropic

# Or: Try Grok first, then OpenAI
LLM_PROVIDER_PRIORITY_ORDER=grok,openai

# Or: Default order (Anthropic → OpenAI → Grok)
# Leave unset or set to: anthropic,openai,grok
```

### How It Works

1. **Reads Priority Order:** From `LLM_PROVIDER_PRIORITY_ORDER` environment variable
2. **Filters to Available:** Only includes providers with API keys configured
3. **Automatic Fallback:** Tries providers in priority order, falls back if one fails
4. **No Code Changes:** Support Agent automatically uses configured order

---

## Examples

### Example 1: Cost-Optimized (Grok First)

```bash
LLM_PROVIDER_PRIORITY_ORDER=grok,openai,anthropic
```

**Behavior:**
- Tries Grok first (typically lowest cost)
- Falls back to OpenAI if Grok fails
- Falls back to Anthropic if OpenAI fails

### Example 2: Quality-Optimized (Anthropic First)

```bash
LLM_PROVIDER_PRIORITY_ORDER=anthropic,openai,grok
```

**Behavior:**
- Tries Anthropic first (best quality)
- Falls back to OpenAI if Anthropic fails
- Falls back to Grok if OpenAI fails

### Example 3: Speed-Optimized (OpenAI First)

```bash
LLM_PROVIDER_PRIORITY_ORDER=openai,grok,anthropic
```

**Behavior:**
- Tries OpenAI first (fastest)
- Falls back to Grok if OpenAI fails
- Falls back to Anthropic if Grok fails

### Example 4: Only Use Available Providers

If you only have OpenAI and Grok configured:
```bash
LLM_PROVIDER_PRIORITY_ORDER=openai,grok,anthropic
```

**Behavior:**
- Tries OpenAI first
- Falls back to Grok (Anthropic skipped - no API key)

---

## Default Behavior

If `LLM_PROVIDER_PRIORITY_ORDER` is not set:

**Default Order:** `anthropic,openai,grok`

**Behavior:**
- Tries Anthropic first
- Falls back to OpenAI
- Falls back to Grok

---

## Provider-Specific Configuration

### Default Models

Each provider has a default model that can be overridden:

```bash
# Anthropic
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Default

# OpenAI
OPENAI_MODEL=gpt-4-turbo-preview  # Default

# Grok
GROK_MODEL=grok-beta  # Default
```

### Temperature

```bash
ANTHROPIC_TEMPERATURE=0.7  # Default
OPENAI_TEMPERATURE=0.7     # Default
GROK_TEMPERATURE=0.7       # Default
```

### Max Tokens

```bash
ANTHROPIC_MAX_TOKENS=4096  # Default
OPENAI_MAX_TOKENS=4096     # Default
GROK_MAX_TOKENS=4096       # Default
```

---

## Support Agent Usage

The Support Agent automatically respects the configured priority order:

```typescript
import { SupportAgent } from '@/lib/ai/support-agent'

// Automatically uses configured priority order
const agent = new SupportAgent()

// All methods automatically use priority order:
const analysis = await agent.analyzeTicket(context)
const response = await agent.generateFirstResponse(context)
const issueResponse = await agent.generateIssueResponse('password_reset', context)
```

**No code changes needed** - the agent automatically uses the configured order.

---

## Priority Order Detection

### Check Current Priority Order

```typescript
import { getLLMProviderPriorityOrder } from '@/lib/config/llm-config'
import { LLMProviderService } from '@/lib/services/llm-provider'

// Get configured order
const configuredOrder = getLLMProviderPriorityOrder()
console.log('Configured order:', configuredOrder)
// Output: ['openai', 'grok', 'anthropic'] (or whatever is configured)

// Get available providers
const available = LLMProviderService.getAvailableProviders()
console.log('Available providers:', available)
// Output: ['openai', 'grok'] (only those with API keys)

// Get effective order (configured order filtered to available)
const effectiveOrder = LLMProviderService.getConfiguredProviderOrder()
console.log('Effective order:', effectiveOrder)
// Output: ['openai', 'grok'] (configured order, filtered to available)
```

---

## Fallback Behavior

### Automatic Fallback

If a provider fails, the system automatically tries the next provider in priority order:

```
1. Try OpenAI (first in priority)
   ❌ Fails (rate limit)
   
2. Try Grok (next in priority)
   ✅ Success
   
Result: Uses Grok, logs that OpenAI failed
```

### All Providers Fail

If all providers fail:
```
1. Try OpenAI → ❌
2. Try Grok → ❌
3. Try Anthropic → ❌

Result: Throws error with details of all failures
```

---

## Logging

The system logs which provider is used:

```
✅ Used LLM provider: openai (from priority order: openai → grok → anthropic)
```

Or if fallback occurs:
```
⚠️ Provider openai failed, trying next in priority order: Rate limit exceeded
✅ Used LLM provider: grok (from priority order: openai → grok → anthropic)
```

---

## Testing

### Test Priority Order

```typescript
import { LLMProviderService } from '@/lib/services/llm-provider'
import { getLLMProviderPriorityOrder } from '@/lib/config/llm-config'

// Check configured order
console.log('Priority order:', getLLMProviderPriorityOrder())

// Check which providers will be used
console.log('Effective order:', LLMProviderService.getConfiguredProviderOrder())

// Test with actual request
const response = await LLMProviderService.generateResponse({
  systemPrompt: 'You are a support agent...',
  userPrompt: 'Test prompt',
})
console.log('Used provider:', response.provider)
```

---

## Best Practices

### 1. Set Priority Based on Use Case

**For Cost Optimization:**
```bash
LLM_PROVIDER_PRIORITY_ORDER=grok,openai,anthropic
```

**For Quality:**
```bash
LLM_PROVIDER_PRIORITY_ORDER=anthropic,openai,grok
```

**For Speed:**
```bash
LLM_PROVIDER_PRIORITY_ORDER=openai,grok,anthropic
```

### 2. Monitor Provider Usage

Track which provider is used most:
```typescript
// Log provider usage
console.log(`Response from: ${response.provider}`)
```

### 3. Handle Provider Failures

The system automatically handles failures, but you can monitor:
```typescript
try {
  const response = await agent.generateFirstResponse(context)
  if (response.provider !== getLLMProviderPriorityOrder()[0]) {
    console.warn('Primary provider failed, used fallback:', response.provider)
  }
} catch (error) {
  console.error('All providers failed:', error)
}
```

---

## Configuration File (Future)

For more complex configurations, a config file could be added:

```typescript
// lib/config/llm-config.json (future)
{
  "priorityOrder": ["openai", "grok", "anthropic"],
  "providers": {
    "anthropic": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.7,
      "maxTokens": 4096
    },
    "openai": {
      "model": "gpt-4-turbo-preview",
      "temperature": 0.7,
      "maxTokens": 4096
    },
    "grok": {
      "model": "grok-beta",
      "temperature": 0.7,
      "maxTokens": 4096
    }
  }
}
```

---

## Related Documentation

- `docs/MULTI_LLM_PROVIDER_SUPPORT.md` - Multi-provider support
- `lib/config/llm-config.ts` - Configuration service
- `lib/services/llm-provider.ts` - Provider service
- `lib/ai/support-agent.ts` - Support Agent

---

**Status:** ✅ **Priority Order Configuration Complete**  
**Ready for:** Production use with configurable provider priority

---

**Last Updated:** January 15, 2026
