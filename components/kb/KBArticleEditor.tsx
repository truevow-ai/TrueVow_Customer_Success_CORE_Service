'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface KBArticleEditorProps {
  articleId?: string
  article?: {
    id: string
    title: string
    content: string
    category: string
  }
}

export function KBArticleEditor({ articleId, article }: KBArticleEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title || '')
  const [content, setContent] = useState(article?.content || '')
  const [category, setCategory] = useState(article?.category || '')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!articleId && !article)

  // Fetch article if articleId provided but no article data
  useEffect(() => {
    if (articleId && !article) {
      fetch(`/api/v1/kb/articles/${articleId}`)
        .then(res => res.json())
        .then(data => {
          if (data.article) {
            setTitle(data.article.title || '')
            setContent(data.article.content || '')
            setCategory(data.article.category || '')
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [articleId, article])

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = (articleId || article?.id)
        ? `/api/v1/kb/articles/${articleId || article?.id}`
        : '/api/v1/kb/articles'
      
      const method = (articleId || article) ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category }),
      })

      if (res.ok) {
        router.push('/dashboard/knowledge-base')
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading article...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/knowledge-base">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">
          {article ? 'Edit Article' : 'New Article'}
        </h1>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
            placeholder="Article title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
            placeholder="Category"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background min-h-[300px]"
            placeholder="Article content (Markdown supported)"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !title}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Article'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
