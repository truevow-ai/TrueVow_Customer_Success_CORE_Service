import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/middleware/api-key'
import { checkRateLimit } from '@/lib/middleware/rate-limit'
import { KBRepository } from '@/lib/repositories/kb'

/**
 * GET /api/v1/customer-portal/kb/search
 * KB search endpoint for customer portal
 * This endpoint is called by Tenant Service on behalf of customers
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key (service-to-service auth)
    const apiKeyValid = await verifyApiKey(request)
    if (!apiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const query = searchParams.get('q')
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter (q) is required' },
        { status: 400 }
      )
    }

    // Rate limiting: 60 searches per minute per tenant
    if (tenantId) {
      const rateLimitResult = await checkRateLimit(request, {
        key: `customer-portal-kb:${tenantId}`,
        limit: 60,
        window: 60, // 1 minute
      })

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
          { status: 429 }
        )
      }
    }

    // Search KB articles
    const articles = await KBRepository.searchArticles({
      query,
      tenantId: tenantId || undefined,
      categoryId: categoryId || undefined,
      limit,
      publishedOnly: true, // Only return published articles for customer portal
    })

    return NextResponse.json({ data: articles, count: articles.length })
  } catch (error: any) {
    console.error('Error searching KB from customer portal:', error)
    return NextResponse.json(
      { error: 'Failed to search knowledge base', details: error.message },
      { status: 500 }
    )
  }
}
