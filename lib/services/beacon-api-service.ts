/**
 * Beacon API Service
 * 
 * Customer-facing knowledge base search and suggestions
 * Powers the Beacon widget in customer portal
 */

import { KBRepository } from '@/lib/repositories/kb'

export interface BeaconArticle {
  article_id: string
  title: string
  excerpt?: string
  content?: string
  category_id?: string
  tags?: string[]
  relevance_score?: number
}

export interface PageContext {
  page_url: string
  page_title?: string
  page_content?: string
  user_id?: string
  tenant_id?: string
}

export class BeaconAPIService {
  /**
   * Search KB articles by query
   */
  static async search(
    query: string,
    context?: PageContext,
    limit: number = 10
  ): Promise<BeaconArticle[]> {
    // Search articles
    const articles = await KBRepository.searchArticles({
      query,
      tenantId: context?.tenant_id,
      limit,
      publishedOnly: true, // Only published articles for customers
    })

    // Calculate relevance scores
    const articlesWithScores = articles.map((article) => ({
      article_id: article.article_id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category_id: article.category_id,
      tags: article.tags,
      relevance_score: this.calculateRelevance(query, article, context),
    }))

    // Sort by relevance
    return articlesWithScores.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
  }

  /**
   * Get contextual article suggestions based on page context
   */
  static async suggest(
    context: PageContext,
    limit: number = 5
  ): Promise<BeaconArticle[]> {
    if (!context.page_url) {
      return []
    }

    // Extract keywords from page URL and title
    const keywords = this.extractKeywords(context)

    if (keywords.length === 0) {
      // Fall back to popular articles
      return this.getPopularArticles(context.tenant_id, limit)
    }

    // Search with keywords
    const query = keywords.join(' ')
    const articles = await this.search(query, context, limit)

    return articles
  }

  /**
   * Get a specific article by ID
   */
  static async getArticle(articleId: string): Promise<BeaconArticle | null> {
    const article = await KBRepository.findArticleById(articleId)

    if (!article || article.status !== 'published') {
      return null
    }

    return {
      article_id: article.article_id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category_id: article.category_id,
      tags: article.tags,
    }
  }

  /**
   * Calculate relevance score for an article
   */
  private static calculateRelevance(
    query: string,
    article: any,
    context?: PageContext
  ): number {
    let score = 0
    const queryLower = query.toLowerCase()
    const titleLower = article.title?.toLowerCase() || ''
    const contentLower = article.content?.toLowerCase() || ''
    const excerptLower = article.excerpt?.toLowerCase() || ''

    // Title match (highest weight)
    if (titleLower.includes(queryLower)) {
      score += 10
    }

    // Exact phrase match in title
    if (titleLower === queryLower) {
      score += 20
    }

    // Content match
    if (contentLower.includes(queryLower)) {
      score += 5
    }

    // Excerpt match
    if (excerptLower.includes(queryLower)) {
      score += 7
    }

    // Tag match
    if (article.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
      score += 8
    }

    // Word-by-word matching
    const queryWords = queryLower.split(/\s+/)
    const titleWords = titleLower.split(/\s+/)
    const matchingWords = queryWords.filter((word) => titleWords.includes(word))
    score += matchingWords.length * 2

    // Context relevance (if page context provided)
    if (context) {
      const pageKeywords = this.extractKeywords(context)
      const articleText = `${titleLower} ${excerptLower} ${contentLower}`
      const contextMatches = pageKeywords.filter((keyword) =>
        articleText.includes(keyword.toLowerCase())
      )
      score += contextMatches.length * 3
    }

    return Math.min(score, 100) // Cap at 100
  }

  /**
   * Extract keywords from page context
   */
  private static extractKeywords(context: PageContext): string[] {
    const keywords: string[] = []

    // Extract from URL path
    if (context.page_url) {
      const urlPath = new URL(context.page_url).pathname
      const pathParts = urlPath.split('/').filter((p) => p && p !== 'index' && p !== 'html')
      keywords.push(...pathParts)
    }

    // Extract from page title
    if (context.page_title) {
      const titleWords = context.page_title
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3)
      keywords.push(...titleWords)
    }

    // Extract from page content (first 500 chars)
    if (context.page_content) {
      const contentWords = context.page_content
        .substring(0, 500)
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 10) // Limit to 10 words
      keywords.push(...contentWords)
    }

    return [...new Set(keywords)] // Remove duplicates
  }

  /**
   * Get popular articles (fallback when no context)
   */
  private static async getPopularArticles(
    tenantId?: string,
    limit: number = 5
  ): Promise<BeaconArticle[]> {
    // Get recently published articles as fallback
    const articles = await KBRepository.findAllArticles({
      status: 'published',
      limit,
    })

    return articles.map((article) => ({
      article_id: article.article_id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category_id: article.category_id,
      tags: article.tags,
      relevance_score: 50, // Default score for popular articles
    }))
  }

  /**
   * Create or update Beacon session
   */
  static async createSession(
    tenantId?: string,
    userId?: string,
    initialContext?: PageContext
  ): Promise<{ session_id: string }> {
    const supabase = createServerSupabase()

    const { data: session } = await supabase
      .from('beacon_sessions')
      .insert({
        tenant_id: tenantId || null,
        user_id: userId || null,
        current_page_url: initialContext?.page_url || null,
        current_page_title: initialContext?.page_title || null,
        is_active: true,
        last_activity_at: new Date().toISOString(),
      })
      .select('session_id')
      .single()

    if (!session) {
      throw new Error('Failed to create beacon session')
    }

    return { session_id: session.session_id }
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(
    sessionId: string,
    context: PageContext
  ): Promise<void> {
    const supabase = createServerSupabase()

    await supabase
      .from('beacon_sessions')
      .update({
        current_page_url: context.page_url,
        current_page_title: context.page_title,
        last_activity_at: new Date().toISOString(),
        metadata: {
          page_features: context.page_content ? { content_preview: context.page_content.substring(0, 200) } : {},
        },
      })
      .eq('session_id', sessionId)
  }
}
