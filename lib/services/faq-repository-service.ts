/**
 * FAQ Repository Service
 * 
 * Enhanced service for managing and accessing FAQs
 * - Categorized FAQs with example responses
 * - Prevents LLM hallucination by using pre-written answers
 * - Accessible to both AI agents and human agents
 */

import { createServerSupabase } from '@/lib/db/supabase'

export interface FAQEntry {
  faq_id: string
  tenant_id?: string | null
  question: string
  answer: string
  category?: string | null
  match_keywords?: string[] | null
  match_intents?: string[] | null
  tags?: string[] | null
  priority: number
  usage_count: number
  helpful_count: number
  not_helpful_count: number
  is_active: boolean
  is_default: boolean
  related_article_id?: string | null
  related_link_url?: string | null
  related_link_text?: string | null
  created_at: string
  updated_at: string
  metadata?: Record<string, any> | null
}

export interface FAQSearchParams {
  query: string
  category?: string
  tenant_id?: string
  min_confidence?: number
  limit?: number
}

export interface FAQSearchResult {
  faq: FAQEntry | null
  confidence: number
  match_type: 'exact' | 'fuzzy' | 'keyword' | 'intent' | 'none'
  all_matches: FAQEntry[]
}

export class FAQRepositoryService {
  /**
   * Search for FAQ by query
   * Returns best match with confidence score
   */
  static async searchFAQ(params: FAQSearchParams): Promise<FAQSearchResult> {
    const {
      query,
      category,
      tenant_id,
      min_confidence = 0.6,
      limit = 10,
    } = params

    const normalizedQuery = this.normalizeQuery(query)
    const supabase = createServerSupabase()

    // Build query
    let queryBuilder = supabase
      .from('cs_faq_entries')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(limit * 2) // Get more for scoring

    // Filter by category if provided
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    // Filter by tenant (include default FAQs)
    if (tenant_id) {
      queryBuilder = queryBuilder.or(`tenant_id.eq.${tenant_id},tenant_id.is.null,is_default.eq.true`)
    } else {
      queryBuilder = queryBuilder.or('tenant_id.is.null,is_default.eq.true')
    }

    const { data: faqs, error } = await queryBuilder

    if (error || !faqs || faqs.length === 0) {
      return {
        faq: null,
        confidence: 0,
        match_type: 'none',
        all_matches: [],
      }
    }

    // Score and rank FAQs
    const scoredFAQs = faqs
      .map(faq => ({
        faq,
        score: this.calculateMatchScore(normalizedQuery, faq),
        match_type: this.determineMatchType(normalizedQuery, faq),
      }))
      .filter(item => item.score >= min_confidence)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    if (scoredFAQs.length === 0) {
      return {
        faq: null,
        confidence: 0,
        match_type: 'none',
        all_matches: [],
      }
    }

    const bestMatch = scoredFAQs[0]

    return {
      faq: bestMatch.faq,
      confidence: bestMatch.score,
      match_type: bestMatch.match_type,
      all_matches: scoredFAQs.map(item => item.faq),
    }
  }

  /**
   * Get FAQ by ID
   */
  static async getFAQById(faqId: string): Promise<FAQEntry | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_faq_entries')
      .select('*')
      .eq('faq_id', faqId)
      .single()

    if (error || !data) {
      return null
    }

    return data as FAQEntry
  }

  /**
   * Get FAQs by category
   */
  static async getFAQsByCategory(
    category: string,
    tenant_id?: string
  ): Promise<FAQEntry[]> {
    const supabase = createServerSupabase()
    let queryBuilder = supabase
      .from('cs_faq_entries')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('priority', { ascending: false })
      .order('usage_count', { ascending: false })

    if (tenant_id) {
      queryBuilder = queryBuilder.or(`tenant_id.eq.${tenant_id},tenant_id.is.null,is_default.eq.true`)
    } else {
      queryBuilder = queryBuilder.or('tenant_id.is.null,is_default.eq.true')
    }

    const { data, error } = await queryBuilder

    if (error || !data) {
      return []
    }

    return data as FAQEntry[]
  }

  /**
   * Get all categories
   */
  static async getCategories(tenant_id?: string): Promise<string[]> {
    const supabase = createServerSupabase()
    let queryBuilder = supabase
      .from('cs_faq_entries')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)

    if (tenant_id) {
      queryBuilder = queryBuilder.or(`tenant_id.eq.${tenant_id},tenant_id.is.null,is_default.eq.true`)
    } else {
      queryBuilder = queryBuilder.or('tenant_id.is.null,is_default.eq.true')
    }

    const { data, error } = await queryBuilder

    if (error || !data) {
      return []
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))]
    return categories as string[]
  }

  /**
   * Increment usage count (when FAQ is used)
   */
  static async incrementUsage(faqId: string): Promise<void> {
    const supabase = createServerSupabase()
    await supabase.rpc('increment_faq_usage', { faq_id: faqId })
  }

  /**
   * Mark FAQ as helpful/not helpful
   */
  static async markHelpful(faqId: string, helpful: boolean): Promise<void> {
    const supabase = createServerSupabase()
    if (helpful) {
      await supabase.rpc('increment_faq_helpful', { faq_id: faqId })
    } else {
      await supabase.rpc('increment_faq_not_helpful', { faq_id: faqId })
    }
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
   * Calculate match score between query and FAQ
   */
  private static calculateMatchScore(query: string, faq: FAQEntry): number {
    const normalizedQuestion = this.normalizeQuery(faq.question)
    const normalizedAnswer = this.normalizeQuery(faq.answer || '')
    const normalizedQuery = query.toLowerCase()

    // Exact match in question = 1.0
    if (normalizedQuestion === normalizedQuery) {
      return 1.0
    }

    // Question contains query = 0.9
    if (normalizedQuestion.includes(normalizedQuery)) {
      return 0.9
    }

    // Query contains question words = 0.8
    const questionWords = normalizedQuestion.split(/\s+/)
    const queryWords = normalizedQuery.split(/\s+/)
    const matchingWords = questionWords.filter(word => queryWords.includes(word))
    if (matchingWords.length === questionWords.length && questionWords.length > 0) {
      return 0.8
    }

    // Answer contains query = 0.7
    if (normalizedAnswer.includes(normalizedQuery)) {
      return 0.7
    }

    // Check match_keywords
    if (faq.match_keywords && faq.match_keywords.length > 0) {
      const keywordMatches = faq.match_keywords.filter(keyword =>
        normalizedQuery.includes(keyword.toLowerCase())
      )
      if (keywordMatches.length > 0) {
        return 0.6 + (keywordMatches.length / faq.match_keywords.length) * 0.2
      }
    }

    // Check match_intents
    if (faq.match_intents && faq.match_intents.length > 0) {
      const detectedIntents = this.detectIntents(normalizedQuery)
      const intentMatches = faq.match_intents.filter(intent =>
        detectedIntents.includes(intent)
      )
      if (intentMatches.length > 0) {
        return 0.5 + (intentMatches.length / faq.match_intents.length) * 0.2
      }
    }

    // Partial word matches = 0.3-0.5
    const wordMatches = queryWords.filter(word =>
      normalizedQuestion.includes(word) || normalizedAnswer.includes(word)
    )
    if (wordMatches.length > 0) {
      return 0.3 + (wordMatches.length / queryWords.length) * 0.2
    }

    return 0.0
  }

  /**
   * Determine match type
   */
  private static determineMatchType(
    query: string,
    faq: FAQEntry
  ): 'exact' | 'fuzzy' | 'keyword' | 'intent' | 'none' {
    const normalizedQuery = query.toLowerCase()
    const normalizedQuestion = this.normalizeQuery(faq.question)

    if (normalizedQuestion === normalizedQuery) {
      return 'exact'
    }

    if (normalizedQuestion.includes(normalizedQuery) || normalizedQuery.includes(normalizedQuestion)) {
      return 'fuzzy'
    }

    // Check for intent keywords
    const intentKeywords = ['how', 'what', 'why', 'can', 'do', 'does', 'is', 'are', 'will']
    const hasIntentKeyword = intentKeywords.some(keyword => normalizedQuery.startsWith(keyword))
    if (hasIntentKeyword) {
      return 'intent'
    }

    // Check if keywords match
    if (faq.match_keywords && faq.match_keywords.length > 0) {
      const keywordMatches = faq.match_keywords.filter(keyword =>
        normalizedQuery.includes(keyword.toLowerCase())
      )
      if (keywordMatches.length > 0) {
        return 'keyword'
      }
    }

    return 'none'
  }

  /**
   * Detect intents from query
   */
  private static detectIntents(query: string): string[] {
    const intents: string[] = []
    const normalizedQuery = query.toLowerCase()

    if (normalizedQuery.startsWith('how')) {
      intents.push('how_to')
    }
    if (normalizedQuery.startsWith('what')) {
      intents.push('what_is')
    }
    if (normalizedQuery.startsWith('why')) {
      intents.push('why')
    }
    if (normalizedQuery.startsWith('can') || normalizedQuery.startsWith('can i')) {
      intents.push('can_i')
    }
    if (normalizedQuery.includes('do you') || normalizedQuery.includes('does')) {
      intents.push('do_you')
    }

    return intents
  }

  /**
   * Format FAQ answer for agent response
   * Ensures professional, empathetic, specific tone
   */
  static formatFAQResponse(faq: FAQEntry, query: string): string {
    let response = faq.answer

    // Add related link if available
    if (faq.related_link_url && faq.related_link_text) {
      response += `\n\nFor more information, see: ${faq.related_link_text} (${faq.related_link_url})`
    }

    return response
  }

  /**
   * Extract main topic from query
   */
  private static extractMainTopic(query: string): string {
    // Remove common question words
    const stopWords = ['how', 'what', 'why', 'can', 'do', 'does', 'is', 'are', 'will', 'the', 'a', 'an']
    const words = query.toLowerCase().split(/\s+/)
    const topicWords = words.filter(word => !stopWords.includes(word) && word.length > 2)
    return topicWords.slice(0, 3).join(' ')
  }
}
