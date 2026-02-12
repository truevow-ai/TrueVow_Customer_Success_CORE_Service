'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Badge } from '@/components/shared/Badge'
import {
  Search,
  X,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'

interface SearchFilters {
  query?: string
  channel?: string[]
  status?: string[]
  priority?: string[]
  assignedTo?: string[]
  tags?: string[]
  dateRange?: {
    from: string
    to: string
  }
}

interface SearchSuggestion {
  type: 'query' | 'filter' | 'tag' | 'customer'
  text: string
  count?: number
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

const CHANNELS = ['email', 'sms', 'call', 'chat', 'facebook', 'form']
const STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export function AdvancedSearch({ onSearch, initialFilters }: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialFilters?.query || '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    channel: initialFilters?.channel || [],
    status: initialFilters?.status || [],
    priority: initialFilters?.priority || [],
    assignedTo: initialFilters?.assignedTo || [],
    tags: initialFilters?.tags || [],
    dateRange: initialFilters?.dateRange,
  })

  // Debounced suggestion fetching
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/inbox/search/suggestions?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.data.suggestions || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = useCallback(() => {
    onSearch({
      ...filters,
      query: query.trim() || undefined,
    })
  }, [query, filters, onSearch])

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'tag') {
      setFilters((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), suggestion.text],
      }))
    } else {
      setQuery(suggestion.text)
    }
    setShowSuggestions(false)
  }

  const toggleFilter = (
    type: 'channel' | 'status' | 'priority' | 'assignedTo' | 'tags',
    value: string
  ) => {
    setFilters((prev) => {
      const current = prev[type] || []
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]

      return {
        ...prev,
        [type]: newValue,
      }
    })
  }

  const clearFilters = () => {
    setQuery('')
    setFilters({
      channel: [],
      status: [],
      priority: [],
      assignedTo: [],
      tags: [],
    })
    onSearch({})
  }

  const hasActiveFilters = 
    query ||
    (filters.channel && filters.channel.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    (filters.assignedTo && filters.assignedTo.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.dateRange

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search conversations, messages, customers..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 pr-10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">{suggestion.text}</span>
                      </div>
                      {suggestion.count && (
                        <Badge className="text-xs">{suggestion.count}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} className="touch-manipulation">
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="touch-manipulation"
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filters</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            {query && (
              <Badge className="bg-blue-100 text-blue-800">
                Query: {query}
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.channel?.map((ch) => (
              <Badge key={ch}>
                {ch}
                <button
                  type="button"
                  onClick={() => toggleFilter('channel', ch)}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.status?.map((s) => (
              <Badge key={s}>
                {s}
                <button
                  type="button"
                  onClick={() => toggleFilter('status', s)}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.tags?.map((tag) => (
              <Badge key={tag}>
                {tag}
                <button
                  type="button"
                  onClick={() => toggleFilter('tags', tag)}
                  className="ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Channels */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Channels
              </label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleFilter('channel', channel)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      filters.channel?.includes(channel)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    } touch-manipulation`}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleFilter('status', status)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      filters.status?.includes(status)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    } touch-manipulation`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => toggleFilter('priority', priority)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      filters.priority?.includes(priority)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    } touch-manipulation`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Date Range
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={filters.dateRange?.from || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: {
                        from: e.target.value,
                        to: prev.dateRange?.to || '',
                      },
                    }))
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm touch-manipulation"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={filters.dateRange?.to || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: {
                        from: prev.dateRange?.from || '',
                        to: e.target.value,
                      },
                    }))
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm touch-manipulation"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
