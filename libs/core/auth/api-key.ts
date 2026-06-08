/**
 * API key verification for route handlers (e.g. renewal APIs).
 * Uses the same key set as lib/middleware/api-key.
 */

import { validateApiKey } from '@/lib/middleware/api-key'

/**
 * Verify an API key string. Returns a Promise for async route handlers.
 */
export async function verifyApiKey(apiKey: string): Promise<boolean> {
  return Promise.resolve(validateApiKey(apiKey))
}
