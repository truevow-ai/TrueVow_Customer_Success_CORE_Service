'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { FileText, Edit } from 'lucide-react'

interface Article {
  id: string
  title: string
  category: string
  updated_at: string
}

export function KBArticleList() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/kb/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading articles...</div>
  }

  if (articles.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No articles yet. Create your first knowledge base article.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {articles.map(article => (
        <Card key={article.id} className="p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium">{article.title}</h3>
            <p className="text-sm text-muted-foreground">{article.category}</p>
          </div>
          <Link href={`/dashboard/knowledge-base/${article.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </Card>
      ))}
    </div>
  )
}
