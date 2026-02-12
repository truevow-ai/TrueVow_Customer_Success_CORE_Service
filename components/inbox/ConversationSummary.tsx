'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Sparkles, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface ConversationSummary {
  summary: string
  key_points: string[]
  customer_issue: string
  resolution_status: 'resolved' | 'in_progress' | 'pending' | 'escalated'
  suggested_actions: string[]
  confidence: number
}

interface ConversationSummaryProps {
  conversationId: string
}

export function ConversationSummary({ conversationId }: ConversationSummaryProps) {
  const [summary, setSummary] = useState<ConversationSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummary()
  }, [conversationId])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/inbox/${conversationId}/summarize`)
      if (!response.ok) throw new Error('Failed to fetch summary')

      const data = await response.json()
      setSummary(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/inbox/${conversationId}/summarize`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to regenerate summary')

      const data = await response.json()
      setSummary(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'escalated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !summary) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Generating summary...</span>
        </div>
      </Card>
    )
  }

  if (error && !summary) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to generate summary</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm">AI Summary</span>
          <Badge className={getStatusColor(summary.resolution_status)}>
            {summary.resolution_status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {Math.round(summary.confidence * 100)}% confidence
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Summary:</div>
          <p className="text-sm text-gray-700">{summary.summary}</p>
        </div>

        {summary.key_points.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Key Points:</div>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {summary.key_points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Customer Issue:</div>
          <p className="text-sm text-gray-700">{summary.customer_issue}</p>
        </div>

        {summary.suggested_actions.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Suggested Actions:</div>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {summary.suggested_actions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}
