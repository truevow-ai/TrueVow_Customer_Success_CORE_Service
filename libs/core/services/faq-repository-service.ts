/**
 * FAQ Repository Service
 * 
 * Manages FAQ entries and categories
 */

export interface FAQEntry {
  id: string
  question: string
  answer: string
  category_id: string
  is_published: boolean
  view_count: number
  helpful_count: number
  not_helpful_count: number
  created_at: string
  updated_at: string
}

export interface FAQCategory {
  id: string
  name: string
  description: string
  order_index: number
  faq_count: number
}

export class FAQRepositoryService {
  /**
   * Get all FAQ entries
   */
  static async getAllFAQs(): Promise<FAQEntry[]> {
    // Mock data for demonstration
    return [
      {
        id: 'faq-1',
        question: 'How do I reset my password?',
        answer: 'You can reset your password by clicking the "Forgot Password" link on the login page and following the instructions sent to your email.',
        category_id: 'cat-1',
        is_published: true,
        view_count: 124,
        helpful_count: 98,
        not_helpful_count: 5,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z'
      },
      {
        id: 'faq-2',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards including Visa, Mastercard, and American Express, as well as PayPal and bank transfers.',
        category_id: 'cat-2',
        is_published: true,
        view_count: 87,
        helpful_count: 72,
        not_helpful_count: 3,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-10T00:00:00Z'
      }
    ]
  }

  /**
   * Get FAQ entry by ID
   */
  static async getFAQById(id: string): Promise<FAQEntry | null> {
    const faqs = await this.getAllFAQs()
    return faqs.find(faq => faq.id === id) || null
  }

  /**
   * Search FAQs by query
   */
  static async searchFAQs(query: string): Promise<FAQEntry[]> {
    const faqs = await this.getAllFAQs()
    const searchTerm = query.toLowerCase()
    
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm) ||
      faq.answer.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Get all FAQ categories
   */
  static async getAllCategories(): Promise<FAQCategory[]> {
    // Mock data for demonstration
    return [
      {
        id: 'cat-1',
        name: 'Account Management',
        description: 'Questions about accounts, passwords, and user settings',
        order_index: 1,
        faq_count: 12
      },
      {
        id: 'cat-2',
        name: 'Billing & Payments',
        description: 'Payment methods, invoices, and billing questions',
        order_index: 2,
        faq_count: 8
      },
      {
        id: 'cat-3',
        name: 'Technical Support',
        description: 'Technical issues and troubleshooting',
        order_index: 3,
        faq_count: 15
      }
    ]
  }

  /**
   * Get FAQs by category
   */
  static async getFAQsByCategory(categoryId: string): Promise<FAQEntry[]> {
    const faqs = await this.getAllFAQs()
    return faqs.filter(faq => faq.category_id === categoryId)
  }

  /**
   * Create new FAQ entry
   */
  static async createFAQ(faqData: Omit<FAQEntry, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'helpful_count' | 'not_helpful_count'>): Promise<FAQEntry> {
    // In a real implementation, this would save to database
    const newFAQ: FAQEntry = {
      ...faqData,
      id: `faq-${Date.now()}`,
      view_count: 0,
      helpful_count: 0,
      not_helpful_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Creating FAQ:', newFAQ)
    return newFAQ
  }

  /**
   * Update FAQ entry
   */
  static async updateFAQ(id: string, updates: Partial<Omit<FAQEntry, 'id' | 'created_at'>>): Promise<FAQEntry | null> {
    const existingFAQ = await this.getFAQById(id)
    if (!existingFAQ) return null
    
    const updatedFAQ: FAQEntry = {
      ...existingFAQ,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    console.log('Updating FAQ:', updatedFAQ)
    return updatedFAQ
  }

  /**
   * Delete FAQ entry
   */
  static async deleteFAQ(id: string): Promise<boolean> {
    console.log('Deleting FAQ:', id)
    return true // In real implementation, would delete from database
  }

  /**
   * Record FAQ view
   */
  static async recordView(faqId: string): Promise<void> {
    console.log('Recording view for FAQ:', faqId)
    // In real implementation, would increment view count
  }

  /**
   * Record helpful vote
   */
  static async recordHelpfulVote(faqId: string, isHelpful: boolean): Promise<void> {
    console.log('Recording vote for FAQ:', faqId, 'Helpful:', isHelpful)
    // In real implementation, would update helpful/not helpful counts
  }
}