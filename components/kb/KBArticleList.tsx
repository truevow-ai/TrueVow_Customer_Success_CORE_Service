'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import Link from 'next/link'
import { Search, Edit, Trash2, Eye, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/toast'
import { optimisticUpdate } from '@/lib/utils/optimistic-update'
import { VirtualizedList } from '@/components/ui/virtualized-list'

interface KBArticle {
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
}

export function KBArticleList() {
  const [articles, setArticles] = useState<KBArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchArticles()
  }, [search, statusFilter, categoryFilter])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category_id', categoryFilter)

      const response = await fetch(`/api/v1/kb/articles?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch articles')

      const data = await response.json()
      setArticles(data.data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const updatedArticles = await optimisticUpdate({
        currentData: articles,
        updateFn: (data) => data.filter((article) => article.article_id !== articleId),
        apiCall: async () => {
          const response = await fetch(`/api/v1/kb/articles/${articleId}`, {
            method: 'DELETE',
          })
          if (!response.ok) throw new Error('Failed to delete article')
          return response.json()
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Article deleted',
            description: 'The article has been deleted successfully.',
          })
          fetchArticles() // Refresh to get actual data
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to delete',
            description: error.message || 'Please try again.',
          })
        },
      })

      setArticles(updatedArticles)
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'review':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-8 w-8 animate-pulse mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Loading articles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      {/* Articles List */}
      {articles.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No articles found</p>
          <Link href="/dashboard/knowledge-base/new">
            <Button>Create First Article</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.length > 50 ? (
            <VirtualizedList
              items={articles}
              estimateSize={150}
              containerClassName="h-[600px]"
              renderItem={(article, index) => (
                <Card key={article.article_id} className="p-6 hover:shadow-md transition-shadow mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/dashboard/knowledge-base/${article.article_id}`}
                          className="text-lg font-semibold text-foreground hover:text-active"
                        >
                          {article.title}
                        </Link>
                        <Badge className={getStatusColor(article.status)}>
                          {article.status}
                        </Badge>
                      </div>
                      {article.excerpt && (
                        <p className="text-foreground-secondary text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                        <span>{format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <span>{article.views} views</span>
                        <span>•</span>
                        <span>
                          {article.helpful_count} helpful
                          {article.not_helpful_count > 0 && ` • ${article.not_helpful_count} not helpful`}
                        </span>
                        {article.tags && article.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-2">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/dashboard/knowledge-base/${article.article_id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/knowledge-base/${article.article_id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(article.article_id)}
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
            articles.map((article) => (
              <Card key={article.article_id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/dashboard/knowledge-base/${article.article_id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {article.title}
                    </Link>
                    <Badge className={getStatusColor(article.status)}>
                      {article.status}
                    </Badge>
                  </div>
                  {article.excerpt && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span>{article.views} views</span>
                    <span>•</span>
                    <span>
                      {article.helpful_count} helpful
                      {article.not_helpful_count > 0 && ` • ${article.not_helpful_count} not helpful`}
                    </span>
                    {article.tags && article.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex gap-2">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/dashboard/knowledge-base/${article.article_id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/knowledge-base/${article.article_id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.article_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
        </div>
      )}
    </div>
  )
}
