'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import { FileText, Search, X } from 'lucide-react'

interface CannedResponse {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

interface CannedResponsesProps {
  onSelect: (content: string) => void
  onClose: () => void
}

export function CannedResponses({ onSelect, onClose }: CannedResponsesProps) {
  const [responses, setResponses] = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchResponses()
  }, [])

  const fetchResponses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/v1/canned-responses?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch canned responses')

      const result = await response.json()
      setResponses(result.data.responses || [])
    } catch (error) {
      console.error('Error fetching canned responses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (search !== undefined) {
      fetchResponses()
    }
  }, [search])

  const filteredResponses = responses.filter((r) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(searchLower) ||
      r.content.toLowerCase().includes(searchLower) ||
      r.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    )
  })

  return (
    <Card className="p-4 max-h-96 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Canned Responses</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredResponses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No canned responses found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResponses.map((response) => (
              <div
                key={response.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onSelect(response.content)
                  onClose()
                }}
              >
                <h4 className="font-medium text-gray-900 mb-1">{response.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{response.content}</p>
                {response.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {response.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
