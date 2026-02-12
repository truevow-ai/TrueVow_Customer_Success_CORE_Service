/**
 * FAQ Management UI
 * 
 * Admin UI for managing FAQs
 * - View, search, and filter FAQs
 * - Create, edit, and delete FAQs
 * - View usage statistics
 */

'use client'

import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { useToast } from '@/components/ui/toast'
import { optimisticUpdate } from '@/lib/utils/optimistic-update'
import { VirtualizedList } from '@/components/ui/virtualized-list'
import { Search, Plus, Edit, Trash2, Save, X, HelpCircle, TrendingUp, ThumbsUp, ThumbsDown, Tag } from 'lucide-react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { cn } from '@/lib/utils/cn'

interface FAQ {
  faq_id: string
  question: string
  answer: string
  category: string | null
  match_keywords: string[]
  match_intents: string[]
  tags: string[]
  priority: number
  usage_count: number
  helpful_count: number
  not_helpful_count: number
  is_active: boolean
  is_default: boolean
  related_link_url?: string | null
  related_link_text?: string | null
  created_at: string
  updated_at: string
}

export default function FAQManagementPage() {
  const { showToast } = useToast()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    category: null,
    match_keywords: [],
    match_intents: [],
    tags: [],
    priority: 0,
    is_active: true,
    is_default: false,
    related_link_url: null,
    related_link_text: null,
  })

  useEffect(() => {
    fetchCategories()
    fetchFAQs()
  }, [])

  useEffect(() => {
    if (selectedCategory === 'all') {
      fetchFAQs()
    } else {
      fetchFAQsByCategory(selectedCategory)
    }
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/faqs/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data?.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchFAQs = async () => {
    setIsLoading(true)
    try {
      // Include inactive FAQs for admin management
      const response = await fetch('/api/v1/faqs?limit=100&include_inactive=true')
      if (response.ok) {
        const data = await response.json()
        setFaqs(data.data?.faqs || [])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFAQsByCategory = async (category: string) => {
    setIsLoading(true)
    try {
      // Include inactive FAQs for admin management
      const response = await fetch(`/api/v1/faqs?category=${category}&limit=100&include_inactive=true`)
      if (response.ok) {
        const data = await response.json()
        setFaqs(data.data?.faqs || [])
      }
    } catch (error) {
      console.error('Error fetching FAQs by category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchFAQs()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/faqs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.data?.faq) {
          setFaqs([data.data.faq])
        } else {
          setFaqs([])
        }
      }
    } catch (error) {
      console.error('Error searching FAQs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingFAQ(null)
    setFormData({
      question: '',
      answer: '',
      category: null,
      match_keywords: [],
      match_intents: [],
      tags: [],
      priority: 0,
      is_active: true,
      is_default: false,
      related_link_url: null,
      related_link_text: null,
    })
  }

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq)
    setIsCreating(false)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || null,
      match_keywords: faq.match_keywords || [],
      match_intents: faq.match_intents || [],
      tags: faq.tags || [],
      priority: faq.priority,
      is_active: faq.is_active !== false,
      is_default: faq.is_default,
      related_link_url: faq.related_link_url || null,
      related_link_text: faq.related_link_text || null,
    })
  }

  const handleSave = async () => {
    if (!formData.question || !formData.answer) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Question and answer are required',
      })
      return
    }

    if (!formData.match_keywords || formData.match_keywords.length === 0) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'At least one match keyword is required for search relevance',
      })
      return
    }

    if (!formData.match_intents || formData.match_intents.length === 0) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'At least one match intent is required for search relevance',
      })
      return
    }

    setIsLoading(true)
    try {
      const url = editingFAQ
        ? `/api/v1/faqs/${editingFAQ.faq_id}`
        : '/api/v1/faqs'
      const method = editingFAQ ? 'PUT' : 'POST'

      // Optimistically update UI
      const newFAQ: FAQ = {
        faq_id: editingFAQ?.faq_id || `temp-${Date.now()}`,
        question: formData.question!,
        answer: formData.answer!,
        category: formData.category || null,
        match_keywords: formData.match_keywords || [],
        match_intents: formData.match_intents || [],
        tags: formData.tags || [],
        priority: formData.priority || 0,
        usage_count: editingFAQ?.usage_count ?? 0,
        helpful_count: editingFAQ?.helpful_count || 0,
        not_helpful_count: editingFAQ?.not_helpful_count || 0,
        is_active: formData.is_active !== false,
        is_default: formData.is_default || false,
        related_link_url: formData.related_link_url || null,
        related_link_text: formData.related_link_text || null,
        created_at: editingFAQ?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const updatedFAQs = await optimisticUpdate({
        currentData: faqs,
        updateFn: (data) => {
          if (editingFAQ) {
            return data.map((faq) => (faq.faq_id === editingFAQ.faq_id ? newFAQ : faq))
          }
          return [...data, newFAQ]
        },
        apiCall: async () => {
          const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to save FAQ')
          }
          return response.json()
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: editingFAQ ? 'FAQ updated' : 'FAQ created',
            description: 'Your changes have been saved successfully.',
          })
          fetchFAQs() // Refresh to get actual data
          setEditingFAQ(null)
          setIsCreating(false)
          setFormData({
            question: '',
            answer: '',
            category: null,
            match_keywords: [],
            match_intents: [],
            tags: [],
            priority: 0,
            is_active: true,
            is_default: false,
            related_link_url: null,
            related_link_text: null,
          })
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to save',
            description: error.message || 'Please try again.',
          })
        },
      })

      setFaqs(updatedFAQs)
    } catch (error) {
      console.error('Error saving FAQ:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return
    }

    setIsLoading(true)
    try {
      const updatedFAQs = await optimisticUpdate({
        currentData: faqs,
        updateFn: (data) => data.filter((faq) => faq.faq_id !== faqId),
        apiCall: async () => {
          const response = await fetch(`/api/v1/faqs/${faqId}`, {
            method: 'DELETE',
          })
          if (!response.ok) throw new Error('Failed to delete FAQ')
          return response.json()
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'FAQ deleted',
            description: 'The FAQ has been deleted successfully.',
          })
          fetchFAQs() // Refresh to get actual data
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to delete',
            description: error.message || 'Please try again.',
          })
        },
      })

      setFaqs(updatedFAQs)
    } catch (error) {
      console.error('Error deleting FAQ:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFAQs = faqs.filter(faq => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category?.toLowerCase().includes(query) ||
      faq.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">FAQ Management</h1>
        <p className="text-sm text-foreground-secondary mb-2">
          Manage frequently asked questions for AI agents and human support. FAQs prevent LLM hallucination by providing pre-approved answers.
        </p>
        <Breadcrumbs
          items={[
            { label: 'Settings', href: '/dashboard/settings' },
            { label: 'FAQs', href: '/dashboard/settings/faqs' },
          ]}
          className="mt-2"
        />
      </div>

      {/* Search Bar */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search FAQs by question, answer, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New FAQ
          </Button>
        </div>
      </Card>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors',
              selectedCategory === 'all'
                ? 'bg-[#2563eb] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                selectedCategory === category
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="text-gray-500">Loading FAQs...</div>
          </Card>
        ) : filteredFAQs.length === 0 ? (
          <Card className="p-12 text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No FAQs found</p>
          </Card>
        ) : (
          filteredFAQs.length > 50 ? (
            <VirtualizedList
              items={filteredFAQs}
              estimateSize={200}
              containerClassName="h-[600px]"
              renderItem={(faq, index) => (
                <Card key={faq.faq_id} className="p-6 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                        {!faq.is_active && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">
                            Inactive
                          </span>
                        )}
                        {faq.is_default && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-foreground-secondary mb-3">{faq.answer}</p>
                      <div className="space-y-2">
                        <div className="flex gap-2 flex-wrap items-center">
                          {faq.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {faq.category}
                            </span>
                          )}
                          {faq.tags?.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-background-secondary text-foreground-secondary text-xs rounded flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        {faq.match_keywords && faq.match_keywords.length > 0 && (
                          <div className="text-xs text-foreground-secondary">
                            <span className="font-medium">Keywords:</span>{' '}
                            <span className="text-foreground-secondary">{faq.match_keywords.join(', ')}</span>
                          </div>
                        )}
                        {faq.match_intents && faq.match_intents.length > 0 && (
                          <div className="text-xs text-foreground-secondary">
                            <span className="font-medium">Intents:</span>{' '}
                            <span className="text-foreground-secondary">{faq.match_intents.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(faq)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(faq.faq_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            />
          ) : (
            filteredFAQs.map((faq) => (
              <Card key={faq.faq_id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    {!faq.is_active && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">
                        Inactive
                      </span>
                    )}
                    {faq.is_default && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{faq.answer}</p>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap items-center">
                      {faq.category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {faq.category}
                        </span>
                      )}
                      {faq.tags?.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    {faq.match_keywords && faq.match_keywords.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Keywords:</span>{' '}
                        <span className="text-gray-500">{faq.match_keywords.join(', ')}</span>
                      </div>
                    )}
                    {faq.match_intents && faq.match_intents.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Intents:</span>{' '}
                        <span className="text-gray-500">{faq.match_intents.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(faq)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(faq.faq_id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Used {faq.usage_count} times
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {faq.helpful_count} helpful
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  {faq.not_helpful_count} not helpful
                </div>
                <div>
                  Priority: {faq.priority}
                </div>
              </div>
              </Card>
            ))
          )
        )}
      </div>

      {/* Create/Edit Modal */}
      {(editingFAQ || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}
                </h2>
                <Button
                  onClick={() => {
                    setEditingFAQ(null)
                    setIsCreating(false)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question *
                  </label>
                  <Input
                    type="text"
                    value={formData.question || ''}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the question..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Answer *
                  </label>
                  <textarea
                    value={formData.answer || ''}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Enter the answer..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority (higher = shown first)
                  </label>
                  <Input
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher priority FAQs appear first in search results
                  </p>
                </div>

                {/* Match Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Match Keywords *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Keywords that trigger this FAQ. Separate with commas. These are critical for search relevance.
                  </p>
                  <Input
                    type="text"
                    value={(formData.match_keywords || []).join(', ')}
                    onChange={(e) => {
                      const keywords = e.target.value
                        .split(',')
                        .map(k => k.trim())
                        .filter(k => k.length > 0)
                      setFormData({ ...formData, match_keywords: keywords })
                    }}
                    placeholder="e.g., password reset, forgot password, can't login"
                    className="w-full"
                  />
                </div>

                {/* Match Intents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Match Intents *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Intent patterns that match this FAQ. Common: how_to, what_is, can_i, troubleshooting, where
                  </p>
                  <Input
                    type="text"
                    value={(formData.match_intents || []).join(', ')}
                    onChange={(e) => {
                      const intents = e.target.value
                        .split(',')
                        .map(i => i.trim())
                        .filter(i => i.length > 0)
                      setFormData({ ...formData, match_intents: intents })
                    }}
                    placeholder="e.g., how_to, troubleshooting, can_i"
                    className="w-full"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Additional tags for filtering and organization. Separate with commas.
                  </p>
                  <Input
                    type="text"
                    value={(formData.tags || []).join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0)
                      setFormData({ ...formData, tags })
                    }}
                    placeholder="e.g., account, login, security"
                    className="w-full"
                  />
                </div>

                {/* Related Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Related Link URL
                    </label>
                    <Input
                      type="url"
                      value={formData.related_link_url || ''}
                      onChange={(e) => setFormData({ ...formData, related_link_url: e.target.value || null })}
                      placeholder="https://example.com/help"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Related Link Text
                    </label>
                    <Input
                      type="text"
                      value={formData.related_link_text || ''}
                      onChange={(e) => setFormData({ ...formData, related_link_text: e.target.value || null })}
                      placeholder="Learn more"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-[#2563eb] focus:ring-[#2563eb] border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                    <p className="text-xs text-gray-500">
                      Inactive FAQs won&apos;t appear in search
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default === true}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="h-4 w-4 text-[#2563eb] focus:ring-[#2563eb] border-gray-300 rounded"
                    />
                    <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                      Default (Available to all tenants)
                    </label>
                    <p className="text-xs text-gray-500">
                      Default FAQs are visible to all tenants
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-gray-500 mb-4">
                    <strong>Search Relevance Tips:</strong> Ensure match_keywords and match_intents are comprehensive. 
                    These fields are critical for preventing LLM hallucination by matching user queries to pre-approved answers.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || !formData.question || !formData.answer || !formData.match_keywords?.length || !formData.match_intents?.length}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingFAQ(null)
                      setIsCreating(false)
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
