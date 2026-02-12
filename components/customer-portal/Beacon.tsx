/**
 * Beacon Component
 * 
 * Customer-facing knowledge base widget with search and suggestions
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Search, X, BookOpen, HelpCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BeaconProps {
  tenantId?: string
  userId?: string
  position?: 'bottom-right' | 'bottom-left'
  mode?: 'inline' | 'widget' // inline = embedded, widget = floating
}

interface Article {
  article_id: string
  title: string
  excerpt?: string
  relevance_score?: number
}

export function Beacon({
  tenantId,
  userId,
  position = 'bottom-right',
  mode = 'widget',
}: BeaconProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'search'>('suggestions')
  const [searchQuery, setSearchQuery] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !sessionId) {
      createSession()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && activeTab === 'suggestions') {
      fetchSuggestions()
    }
  }, [isOpen, activeTab, sessionId])

  useEffect(() => {
    if (searchQuery && activeTab === 'search') {
      const timeoutId = setTimeout(() => {
        performSearch()
      }, 300) // Debounce

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, activeTab])

  const createSession = async () => {
    try {
      const response = await fetch('/api/v1/beacon/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          user_id: userId,
          page_url: window.location.href,
          page_title: document.title,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.data?.session_id)
      }
    } catch (error) {
      console.error('Error creating beacon session:', error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/beacon/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            page_url: window.location.href,
            page_title: document.title,
            tenant_id: tenantId,
          },
          limit: 5,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setArticles(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setArticles([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/v1/beacon/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          context: {
            page_url: window.location.href,
            page_title: document.title,
            tenant_id: tenantId,
          },
          limit: 10,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setArticles(data.data || [])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/v1/beacon/article/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedArticle(data.data)
      }
    } catch (error) {
      console.error('Error fetching article:', error)
    }
  }

  if (mode === 'inline') {
    // Inline mode - embedded in page
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Help & Support</h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={cn(
                'flex-1 px-4 py-2 rounded text-sm font-medium',
                activeTab === 'suggestions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              Suggestions
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                'flex-1 px-4 py-2 rounded text-sm font-medium',
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              Search
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..."
                className="pl-10"
              />
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : selectedArticle ? (
            <div className="space-y-2">
              <Button
                onClick={() => setSelectedArticle(null)}
                variant="ghost"
                size="sm"
              >
                ← Back
              </Button>
              <div>
                <h4 className="font-semibold mb-2">{selectedArticle.title}</h4>
                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedArticle.excerpt || selectedArticle.content}
                </div>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activeTab === 'suggestions'
                ? 'No suggestions available'
                : 'No articles found'}
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <button
                  key={article.article_id}
                  onClick={() => fetchArticle(article.article_id)}
                  className="w-full text-left p-3 rounded border hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-sm">{article.title}</div>
                  {article.excerpt && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {article.excerpt}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Widget mode - floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center',
          position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
        )}
        aria-label="Open help"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed z-50 bg-white rounded-lg shadow-2xl flex flex-col',
        position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6',
        'w-96 h-[500px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <span className="font-semibold">Help & Support</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-blue-700 rounded p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={cn(
              'flex-1 px-4 py-2 rounded text-sm font-medium',
              activeTab === 'suggestions'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex-1 px-4 py-2 rounded text-sm font-medium',
              activeTab === 'search'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            Search
          </button>
        </div>

        {activeTab === 'search' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="pl-10"
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          </div>
        ) : selectedArticle ? (
          <div className="space-y-2">
            <Button
              onClick={() => setSelectedArticle(null)}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
            <div>
              <h4 className="font-semibold mb-2">{selectedArticle.title}</h4>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedArticle.excerpt || selectedArticle.content}
              </div>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {activeTab === 'suggestions'
              ? 'No suggestions available'
              : 'No articles found'}
          </div>
        ) : (
          <div className="space-y-2">
            {articles.map((article) => (
              <button
                key={article.article_id}
                onClick={() => fetchArticle(article.article_id)}
                className="w-full text-left p-3 rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">{article.title}</div>
                {article.excerpt && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {article.excerpt}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
