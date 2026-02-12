/**
 * Tier 1: Rule-Based FAQ Agent
 * 
 * Deterministic FAQ matching agent that searches pre-approved questions/answers
 * from knowledge base. This is the FIRST choice for all queries.
 * 
 * Features:
 * - Exact match and fuzzy matching
 * - Intent-based matching
 * - Confidence scoring
 * - Zero LLM usage - completely deterministic
 */

import { KBRepository } from '@/lib/repositories/kb'
import { createServerSupabase } from '@/lib/db/supabase'
import { FAQRepositoryService } from '@/lib/services/faq-repository-service'

export interface FAQMatch {
  question: string
  answer: string
  confidence: number // 0-1
  matchType: 'exact' | 'fuzzy' | 'intent' | 'keyword'
  source: 'kb_article' | 'faq_table' | 'template'
  articleId?: string
  category?: string
  tags?: string[]
}

export interface FAQSearchResult {
  matches: FAQMatch[]
  bestMatch: FAQMatch | null
  hasMatch: boolean
}

export class Tier1FAQAgent {
  /**
   * Search for FAQ matches in knowledge base and FAQ table
   */
  static async searchFAQ(
    query: string,
    tenantId?: string
  ): Promise<FAQSearchResult> {
    const normalizedQuery = this.normalizeQuery(query)
    
    // Search in both KB articles and FAQ table
    const [kbMatches, faqMatches] = await Promise.all([
      this.searchKBArticles(normalizedQuery, tenantId),
      this.searchFAQTable(normalizedQuery, tenantId),
    ])

    // Combine and rank matches
    const allMatches = [...kbMatches, ...faqMatches]
      .sort((a, b) => b.confidence - a.confidence)

    return {
      matches: allMatches,
      bestMatch: allMatches.length > 0 ? allMatches[0] : null,
      hasMatch: allMatches.length > 0 && allMatches[0].confidence >= 0.6, // 60% confidence threshold
    }
  }

  /**
   * Search knowledge base articles for FAQ matches
   */
  private static async searchKBArticles(
    query: string,
    tenantId?: string
  ): Promise<FAQMatch[]> {
    const supabase = createServerSupabase()
    
    // Search published KB articles
    const { data: articles, error } = await supabase
      .from('cs_kb_articles')
      .select('article_id, title, content, excerpt, tags, category_id')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .limit(10)

    if (error || !articles) {
      return []
    }

    const matches: FAQMatch[] = []

    for (const article of articles) {
      const confidence = this.calculateMatchConfidence(query, article.title, article.content || article.excerpt || '')
      
      if (confidence >= 0.5) { // 50% minimum confidence
        matches.push({
          question: article.title,
          answer: article.excerpt || article.content.substring(0, 500) + '...',
          confidence,
          matchType: this.determineMatchType(query, article.title, article.content || ''),
          source: 'kb_article',
          articleId: article.article_id,
          tags: article.tags || [],
        })
      }
    }

    return matches
  }

  /**
   * Search FAQ table for exact FAQ entries
   * @deprecated Use FAQRepositoryService.searchFAQ instead
   * Kept for backward compatibility
   */
  private static async searchFAQTable(
    query: string,
    tenantId?: string
  ): Promise<FAQMatch[]> {
    // This method is now handled by FAQRepositoryService in searchFAQ
    // Return empty array as FAQRepositoryService handles this
    return []
  }

  /**
   * Calculate match confidence between query and text
   */
  private static calculateMatchConfidence(
    query: string,
    title: string,
    content: string
  ): number {
    const normalizedQuery = query.toLowerCase()
    const normalizedTitle = title.toLowerCase()
    const normalizedContent = content.toLowerCase()

    // Exact match in title = 1.0
    if (normalizedTitle === normalizedQuery) {
      return 1.0
    }

    // Title contains query = 0.9
    if (normalizedTitle.includes(normalizedQuery)) {
      return 0.9
    }

    // Query contains title words = 0.8
    const titleWords = normalizedTitle.split(/\s+/)
    const queryWords = normalizedQuery.split(/\s+/)
    const matchingWords = titleWords.filter(word => queryWords.includes(word))
    if (matchingWords.length === titleWords.length && titleWords.length > 0) {
      return 0.8
    }

    // Content contains query = 0.7
    if (normalizedContent.includes(normalizedQuery)) {
      return 0.7
    }

    // Partial word matches = 0.5-0.6
    const wordMatches = queryWords.filter(word => 
      normalizedTitle.includes(word) || normalizedContent.includes(word)
    )
    if (wordMatches.length > 0) {
      return 0.5 + (wordMatches.length / queryWords.length) * 0.1
    }

    return 0.0
  }

  /**
   * Determine match type
   */
  private static determineMatchType(
    query: string,
    title: string,
    content: string
  ): 'exact' | 'fuzzy' | 'intent' | 'keyword' {
    const normalizedQuery = query.toLowerCase()
    const normalizedTitle = title.toLowerCase()

    if (normalizedTitle === normalizedQuery) {
      return 'exact'
    }

    if (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle)) {
      return 'fuzzy'
    }

    // Check for intent keywords (how, what, why, can, etc.)
    const intentKeywords = ['how', 'what', 'why', 'can', 'do', 'does', 'is', 'are', 'will']
    const hasIntentKeyword = intentKeywords.some(keyword => normalizedQuery.startsWith(keyword))
    
    if (hasIntentKeyword) {
      return 'intent'
    }

    return 'keyword'
  }

  /**
   * Normalize query for matching
   */
  private static normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  /**
   * Get base response from FAQ match
   */
  static getBaseResponse(match: FAQMatch): {
    answer: string
    confidence: number
    source: string
    articleId?: string
  } {
    return {
      answer: match.answer,
      confidence: match.confidence,
      source: match.source,
      articleId: match.articleId,
    }
  }
}
