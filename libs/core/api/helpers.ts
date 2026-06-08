import { NextRequest, NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'

/**
 * API Response Helpers
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  )
}

/**
 * Create error response
 */
export function errorResponse(
  error: string | Error,
  status: number = 400
): NextResponse<ApiResponse> {
  const errorMessage = error instanceof Error ? error.message : error
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status }
  )
}

/**
 * Create not found response
 */
export function notFoundResponse(message: string = 'Resource not found'): NextResponse<ApiResponse> {
  return errorResponse(message, 404)
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return errorResponse(message, 401)
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return errorResponse(message, 403)
}

/**
 * Validate request body with Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: errorResponse(
          `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
          400
        ),
      }
    }
    return {
      success: false,
      response: errorResponse('Invalid request body', 400),
    }
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    const data = schema.parse(searchParams)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: errorResponse(
          `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
          400
        ),
      }
    }
    return {
      success: false,
      response: errorResponse('Invalid query parameters', 400),
    }
  }
}

/**
 * Get pagination parameters from request
 */
export function getPagination(req: NextRequest): { page: number; limit: number; offset: number } {
  const searchParams = req.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (error instanceof Error) {
    // Handle known error types
    if (error.message.includes('Unauthorized')) {
      return unauthorizedResponse(error.message)
    }
    if (error.message.includes('Forbidden')) {
      return forbiddenResponse(error.message)
    }
    if (error.message.includes('not found')) {
      return notFoundResponse(error.message)
    }
    return errorResponse(error.message, 500)
  }

  return errorResponse('Internal server error', 500)
}

/**
 * Async handler wrapper for error handling
 */
export function asyncHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

