'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Form, FormField, FormLabel } from '@/components/shared/Form'
import { useRouter } from 'next/navigation'
import { Save, X, FileText, Calendar, User, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { optimisticUpdate } from '@/lib/utils/optimistic-update'
import { ContextualSidebar } from '@/components/layout/ContextualSidebar'
import { Badge } from '@/components/shared/Badge'

interface KBCategory {
  category_id: string
  name: string
  description: string | null
}

export function KBArticleEditor({ params }: { params?: Promise<{ id: string }> }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<KBCategory[]>([])
  const [articleId, setArticleId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [articleData, setArticleData] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    tags: '',
    status: 'draft' as 'draft' | 'review' | 'published' | 'archived',
  })

  useEffect(() => {
    fetchCategories()
    if (params) {
      params.then((p) => {
        setArticleId(p.id)
        fetchArticle(p.id)
      })
    }
  }, [params])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/kb/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchArticle = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/kb/articles/${id}`)
      if (!response.ok) throw new Error('Failed to fetch article')
      const data = await response.json()
      const article = data.data
      setFormData({
        title: article.title || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        category_id: article.category_id || '',
        tags: article.tags?.join(', ') || '',
        status: article.status || 'draft',
      })
    } catch (error) {
      console.error('Error fetching article:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        category_id: formData.category_id || null,
        excerpt: formData.excerpt || null,
      }

      const url = articleId ? `/api/v1/kb/articles/${articleId}` : '/api/v1/kb/articles'
      const method = articleId ? 'PUT' : 'POST'

      // Use optimistic update for better perceived performance
      // Show success toast immediately (optimistic)
      showToast({
        type: 'success',
        title: articleId ? 'Article updated' : 'Article created',
        description: 'Your changes have been saved.',
      })

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save article')
      }

      // Success - navigate away
      router.push('/dashboard/knowledge-base')
    } catch (error) {
      console.error('Error saving article:', error)
      showToast({
        type: 'error',
        title: 'Failed to save',
        description: 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c.category_id === formData.category_id)

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <Card className="p-6">
          <Form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <FormField>
            <FormLabel>Title *</FormLabel>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Article title"
            />
          </FormField>

          <FormField>
            <FormLabel>Excerpt</FormLabel>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Brief summary of the article"
            />
          </FormField>

          <FormField>
            <FormLabel>Content *</FormLabel>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
              rows={20}
              placeholder="Article content (HTML supported)"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Category</FormLabel>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField>
              <FormLabel>Status</FormLabel>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
          </div>

          <FormField>
            <FormLabel>Tags</FormLabel>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated tags (e.g., onboarding, technical, billing)"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Article'}
            </Button>
          </div>
        </div>
      </Form>
    </Card>
      </div>

      {/* Contextual Sidebar - Article Metadata */}
      <ContextualSidebar
        open={showSidebar}
        onClose={() => setShowSidebar(false)}
        title="Article Metadata"
        width="320px"
      >
        <div className="space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Status</h3>
            <Badge className={
              formData.status === 'published' ? 'bg-green-100 text-green-800' :
              formData.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              formData.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }>
              {formData.status}
            </Badge>
          </div>

          {/* Category */}
          {selectedCategory && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Category</h3>
              <p className="text-sm text-foreground-secondary">{selectedCategory.name}</p>
            </div>
          )}

          {/* Tags */}
          {formData.tags && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {formData.tags.split(',').map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Article Info */}
          {articleData && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Article Info</h3>
                <div className="space-y-2 text-sm text-foreground-secondary">
                  {articleData.views !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{articleData.views} views</span>
                    </div>
                  )}
                  {articleData.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(articleData.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {articleData.updated_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Updated: {new Date(articleData.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Preview</h3>
            <div className="text-sm text-foreground-secondary space-y-2">
              <p className="font-medium">{formData.title || 'Untitled'}</p>
              {formData.excerpt && (
                <p className="text-xs">{formData.excerpt}</p>
              )}
              <p className="text-xs text-foreground-secondary/70">
                {formData.content.length} characters
              </p>
            </div>
          </div>
        </div>
      </ContextualSidebar>
    </div>
  )
}
