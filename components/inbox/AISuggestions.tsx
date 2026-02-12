'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button, Badge } from '@/components/shared'
import { Sparkles, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface AISuggestion {
  confidence: 'high' | 'medium' | 'low'
  response: string
  reasoning: string
  kbArticles?: Array<{ id: string; title: string; relevance: number }>
}

interface TriageResult {
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sentiment: string
  intent: string
  confidence: number
  suggestedTags?: string[]
  requiresHumanReview: boolean
}

interface AISuggestionsProps {
  messageId: string | null
  onSuggestionSelect: (suggestion: string) => void
}

export function AISuggestions({ messageId, onSuggestionSelect }: AISuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [triage, setTriage] = useState<TriageResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (messageId) {
      fetchSuggestion()
    }
  }, [messageId])

  const fetchSuggestion = async () => {
    if (!messageId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId }),
      })

      if (!response.ok) throw new Error('Failed to get AI suggestion')

      const result = await response.json()
      setSuggestion(result.data.suggestion)
      setTriage(result.data.triage)
    } catch (err) {
      console.error('Error fetching AI suggestion:', err)
      setError('Failed to load AI suggestion')
    } finally {
      setLoading(false)
    }
  }

  if (!messageId) {
    return null
  }

  const confidenceColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchSuggestion}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        {loading && !suggestion && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Analyzing message...</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {triage && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge>{triage.category}</Badge>
              <Badge className={triage.priority === 'urgent' ? 'bg-red-100 text-red-800' : ''}>
                {triage.priority}
              </Badge>
              <Badge>{triage.sentiment}</Badge>
              <Badge className={confidenceColors[suggestion?.confidence || 'medium']}>
                {triage.confidence}% confidence
              </Badge>
            </div>
            {triage.suggestedTags && triage.suggestedTags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-gray-500">Suggested tags:</span>
                {triage.suggestedTags.map((tag) => (
                  <Badge key={tag} className="bg-gray-100 text-gray-800 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {triage.requiresHumanReview && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Requires human review</span>
              </div>
            )}
          </div>
        )}

        {suggestion && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Suggested Response</span>
                <Badge className={confidenceColors[suggestion.confidence]}>
                  {suggestion.confidence} confidence
                </Badge>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{suggestion.response}</p>
              </div>
              {suggestion.reasoning && (
                <p className="text-xs text-gray-500 mt-1">{suggestion.reasoning}</p>
              )}
            </div>

            {suggestion.kbArticles && suggestion.kbArticles.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Related Articles</span>
                <div className="mt-2 space-y-1">
                  {suggestion.kbArticles.map((article) => (
                    <a
                      key={article.id}
                      href={`/dashboard/kb/${article.id}`}
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onSuggestionSelect(suggestion.response)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Use Suggestion
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
