/**
 * Rate Limiting Middleware
 * Prevents abuse and prompt injection attacks through rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (in production, use Redis)
const rateLimitStore: RateLimitStore = {}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (req: NextRequest) => string // Custom key generator
}

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): { allowed: boolean; remaining: number; resetAt: number } | null => {
    const now = Date.now()
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : getDefaultKey(req)

    const record = rateLimitStore[key]

    // Reset if window expired
    if (!record || now > record.resetAt) {
      rateLimitStore[key] = {
        count: 1,
        resetAt: now + config.windowMs,
      }
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs,
      }
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      }
    }

    // Increment count
    record.count++
    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetAt: record.resetAt,
    }
  }
}

function getDefaultKey(req: NextRequest): string {
  // Use IP address and user ID for rate limiting
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
  const userId = req.headers.get('x-user-id') || 'anonymous'
  return `${ip}:${userId}`
}

/**
 * Rate limit wrapper for API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const limit = rateLimit(config)
    const result = limit(req)

    if (!result || !result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result?.resetAt || Date.now() + config.windowMs - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result?.remaining.toString() || '0',
            'X-RateLimit-Reset': result?.resetAt.toString() || Date.now().toString(),
            'Retry-After': Math.ceil((result?.resetAt || Date.now() + config.windowMs - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const response = await handler(req)
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetAt.toString())

    return response
  }
}

/**
 * Rate limit middleware wrapper (for backward compatibility)
 * Creates a middleware function that can be used directly in route handlers
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return withRateLimit(config, handler)
  }
}

/** Config for checkRateLimit (key-based, window in seconds) */
export interface CheckRateLimitConfig {
  key: string
  limit: number
  window: number // seconds
}

const checkRateLimitStore: Record<string, { count: number; resetAt: number }> = {}

/**
 * Check rate limit by custom key (for use in route handlers).
 * Returns { allowed, retryAfter? } - retryAfter in seconds when not allowed.
 */
export async function checkRateLimit(
  _req: NextRequest,
  config: CheckRateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now()
  const windowMs = config.window * 1000
  const record = checkRateLimitStore[config.key]

  if (!record || now > record.resetAt) {
    checkRateLimitStore[config.key] = {
      count: 1,
      resetAt: now + windowMs,
    }
    return { allowed: true }
  }

  if (record.count >= config.limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}
