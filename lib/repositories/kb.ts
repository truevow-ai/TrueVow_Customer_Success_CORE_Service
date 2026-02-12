import { createServerSupabase } from '@/lib/db/supabase'

export interface KBArticle {
  article_id: string
  title: string
  content: string
  excerpt: string | null
  category_id: string | null
  tags: string[]
  status: 'draft' | 'review' | 'published' | 'archived'
  author_id: string
  views: number
  helpful_count: number
  not_helpful_count: number
  created_at: string
  updated_at: string
  published_at: string | null
  metadata: Record<string, any>
}

export interface KBArticleInsert {
  title: string
  content: string
  excerpt?: string | null
  category_id?: string | null
  tags?: string[]
  status?: 'draft' | 'review' | 'published' | 'archived'
  author_id: string
  metadata?: Record<string, any>
}

export interface KBArticleUpdate {
  title?: string
  content?: string
  excerpt?: string | null
  category_id?: string | null
  tags?: string[]
  status?: 'draft' | 'review' | 'published' | 'archived'
  published_at?: string | null
  metadata?: Record<string, any>
}

export interface KBCategory {
  category_id: string
  name: string
  description: string | null
  parent_category_id: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export class KBRepository {
  /**
   * Get all articles with optional filters
   */
  static async findAllArticles(filters?: {
    status?: string
    categoryId?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<KBArticle[]> {
    const supabase = createServerSupabase()
    let query = supabase.from('support_kb_articles').select('*')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.search) {
      // Full-text search on title and content
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
    }

    query = query.order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as KBArticle[]
  }

  /**
   * Get published articles only (for customer-facing KB)
   */
  static async findPublishedArticles(search?: string): Promise<KBArticle[]> {
    return this.findAllArticles({ status: 'published', search })
  }

  /**
   * Search articles (alias for findAllArticles with search)
   */
  static async searchArticles(options: {
    query: string
    tenantId?: string
    categoryId?: string
    limit?: number
    publishedOnly?: boolean
  }): Promise<KBArticle[]> {
    return this.findAllArticles({
      search: options.query,
      categoryId: options.categoryId,
      status: options.publishedOnly ? 'published' : undefined,
      limit: options.limit,
    })
  }

  /**
   * Get article by ID
   */
  static async findArticleById(articleId: string): Promise<KBArticle | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_kb_articles')
      .select('*')
      .eq('article_id', articleId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as KBArticle
  }

  /**
   * Create a new article
   */
  static async createArticle(article: KBArticleInsert): Promise<KBArticle> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_kb_articles')
      .insert({
        ...article,
        status: article.status || 'draft',
        tags: article.tags || [],
        metadata: article.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return data as KBArticle
  }

  /**
   * Update an article
   */
  static async updateArticle(articleId: string, updates: KBArticleUpdate): Promise<KBArticle> {
    const supabase = createServerSupabase()
    
    // If publishing, set published_at
    if (updates.status === 'published' && !updates.published_at) {
      updates.published_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('cs_kb_articles')
      .update(updates)
      .eq('article_id', articleId)
      .select()
      .single()

    if (error) throw error
    return data as KBArticle
  }

  /**
   * Delete an article (soft delete by archiving)
   */
  static async deleteArticle(articleId: string): Promise<void> {
    await this.updateArticle(articleId, { status: 'archived' })
  }

  /**
   * Increment article views
   */
  static async incrementViews(articleId: string): Promise<void> {
    const supabase = createServerSupabase()
    const { error } = await supabase.rpc('increment_article_views', { article_id: articleId })
    
    // If RPC doesn't exist, do it manually
    if (error) {
      const article = await this.findArticleById(articleId)
      if (article) {
        await this.updateArticle(articleId, { views: article.views + 1 } as any)
      }
    }
  }

  /**
   * Mark article as helpful
   */
  static async markHelpful(articleId: string): Promise<void> {
    const supabase = createServerSupabase()
    const article = await this.findArticleById(articleId)
    if (article) {
      await this.updateArticle(articleId, { helpful_count: article.helpful_count + 1 } as any)
    }
  }

  /**
   * Get all categories
   */
  static async findAllCategories(): Promise<KBCategory[]> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_kb_categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return data as KBCategory[]
  }

  /**
   * Get category by ID
   */
  static async findCategoryById(categoryId: string): Promise<KBCategory | null> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_kb_categories')
      .select('*')
      .eq('category_id', categoryId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as KBCategory
  }

  /**
   * Create a new category
   */
  static async createCategory(category: {
    name: string
    description?: string | null
    parent_category_id?: string | null
    order_index?: number
  }): Promise<KBCategory> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_kb_categories')
      .insert({
        ...category,
        order_index: category.order_index || 0,
      })
      .select()
      .single()

    if (error) throw error
    return data as KBCategory
  }

  /**
   * Update a category
   */
  static async updateCategory(categoryId: string, updates: Partial<KBCategory>): Promise<KBCategory> {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('cs_kb_categories')
      .update(updates)
      .eq('category_id', categoryId)
      .select()
      .single()

    if (error) throw error
    return data as KBCategory
  }
}

