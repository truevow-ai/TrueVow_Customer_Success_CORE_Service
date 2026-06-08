/**
 * API Route Middleware
 * Request/response logging and error handling wrapper for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  apiLogger, 
  generateRequestId, 
  createTimer,
  type LogEntry 
} from '@/lib/utils/api-logger'
import { RETRY_CONFIG } from '@/lib/config/app-config'

export interface APIContext {
  requestId: string
  userId?: string
  tenantId?: string
  teamMemberId?: string
}

export type APIHandler<T = any> = (
  request: NextRequest,
  context: APIContext
) => Promise<NextResponse<T | { error: string; message: string; requestId: string }>>

export type APIHandlerWithParams<T = any> = (
  request: NextRequest,
  context: APIContext,
  params: Record<string, string>
) => Promise<NextResponse<T | { error: string; message: string; requestId: string }>>

/**
 * Wrap an API handler with logging and error handling
 */
export function withLogging<T = any>(
  handler: APIHandler<T>,
  options: {
    serviceName?: string
    skipBodyLogging?: boolean
  } = {}
): APIHandler<T> {
  return async (request: NextRequest, context: APIContext) => {
    const timer = createTimer()
    const requestId = context.requestId || generateRequestId()
    const method = request.method
    const path = new URL(request.url).pathname

    // Log request start
    apiLogger.requestStart(requestId, method, path, {
      userId: context.userId,
      tenantId: context.tenantId,
    })

    try {
      const response = await handler(request, { ...context, requestId })
      const durationMs = timer()

      // Log request end
      apiLogger.requestEnd(requestId, method, path, response.status, durationMs, {
        userId: context.userId,
        tenantId: context.tenantId,
      })

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)
      
      return response
    } catch (error) {
      const durationMs = timer()
      
      apiLogger.requestError(
        requestId,
        method,
        path,
        error instanceof Error ? error : new Error(String(error)),
        durationMs,
        {
          userId: context.userId,
          tenantId: context.tenantId,
        }
      )

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'An unexpected error occurred',
          requestId,
        },
        { status: 500, headers: { 'X-Request-ID': requestId } }
      )
    }
  }
}

/**
 * Wrap an API handler with params (for dynamic routes)
 */
export function withLoggingAndParams<T = any>(
  handler: APIHandlerWithParams<T>,
  options: {
    serviceName?: string
    skipBodyLogging?: boolean
  } = {}
): APIHandlerWithParams<T> {
  return async (request: NextRequest, context: APIContext, params: Record<string, string>) => {
    const timer = createTimer()
    const requestId = context.requestId || generateRequestId()
    const method = request.method
    const path = new URL(request.url).pathname

    // Log request start
    apiLogger.requestStart(requestId, method, path, {
      userId: context.userId,
      tenantId: context.tenantId,
      metadata: { params },
    })

    try {
      const response = await handler(request, { ...context, requestId }, params)
      const durationMs = timer()

      // Log request end
      apiLogger.requestEnd(requestId, method, path, response.status, durationMs, {
        userId: context.userId,
        tenantId: context.tenantId,
        metadata: { params },
      })

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)
      
      return response
    } catch (error) {
      const durationMs = timer()
      
      apiLogger.requestError(
        requestId,
        method,
        path,
        error instanceof Error ? error : new Error(String(error)),
        durationMs,
        {
          userId: context.userId,
          tenantId: context.tenantId,
          metadata: { params },
        }
      )

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'An unexpected error occurred',
          requestId,
        },
        { status: 500, headers: { 'X-Request-ID': requestId } }
      )
    }
  }
}

/**
 * Standard API response helpers
 */
export const APIResponse = {
  success<T>(data: T, message?: string, status = 200): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      message,
    }, { status })
  },

  error(message: string, status = 400, code?: string): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
    }, { status })
  },

  notFound(resource = 'Resource'): NextResponse {
    return NextResponse.json({
      success: false,
      error: `${resource} not found`,
      code: 'NOT_FOUND',
    }, { status: 404 })
  },

  unauthorized(message = 'Unauthorized'): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
    }, { status: 401 })
  },

  forbidden(message = 'Forbidden'): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code: 'FORBIDDEN',
    }, { status: 403 })
  },

  validationError(errors: Record<string, string[]>): NextResponse {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    }, { status: 422 })
  },

  paginated<T>(
    data: T[],
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  ): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      pagination,
    })
  },
}

/**
 * Request validation helper
 */
export function validateRequest<T extends Record<string, any>>(
  body: unknown,
  schema: {
    [K in keyof T]: {
      required?: boolean
      type: 'string' | 'number' | 'boolean' | 'array' | 'object'
      validate?: (value: any) => boolean
      transform?: (value: any) => any
    }
  }
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {}
  const data: Record<string, any> = {}

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { _body: ['Invalid request body'] } }
  }

  const input = body as Record<string, any>

  for (const [key, config] of Object.entries(schema)) {
    const value = input[key]

    // Check required
    if (config.required && (value === undefined || value === null)) {
      errors[key] = [`${key} is required`]
      continue
    }

    // Skip if not provided and not required
    if (value === undefined || value === null) {
      continue
    }

    // Check type
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== config.type) {
      errors[key] = [`${key} must be of type ${config.type}`]
      continue
    }

    // Custom validation
    if (config.validate && !config.validate(value)) {
      errors[key] = [`${key} is invalid`]
      continue
    }

    // Transform value
    data[key] = config.transform ? config.transform(value) : value
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: data as T }
}
