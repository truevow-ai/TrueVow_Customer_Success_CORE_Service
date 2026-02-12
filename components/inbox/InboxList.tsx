'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import { VirtualizedList } from '@/components/ui/virtualized-list'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/shared/Table'
import {
  Mail,
  MessageSquare,
  Phone,
  Facebook,
  MessageCircle,
  FileText,
  Filter,
  Search,
  User,
  Clock,
  Users,
  Briefcase,
  Settings,
  BarChart3,
  Bot,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { BulkActions } from './BulkActions'
import { AdvancedSearch } from './AdvancedSearch'

type InboxContext = 'sales' | 'cs' | 'ops' | 'management' | 'ai'

interface InboxContextOption {
  value: InboxContext
  label: string
  icon: typeof Users
  description: string
}

interface Conversation {
  conversation_id: string
  ticket_id: string | null
  channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
  customer_email: string
  customer_name: string | null
  subject: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  assigned_to_name: string | null
  tenant_id: string | null
  created_at: string
}

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  chat: MessageCircle,
  facebook: Facebook,
  form: FileText,
}

const CHANNEL_COLORS = {
  email: 'bg-blue-100 text-blue-800',
  sms: 'bg-green-100 text-green-800',
  call: 'bg-purple-100 text-purple-800',
  chat: 'bg-yellow-100 text-yellow-800',
  facebook: 'bg-indigo-100 text-indigo-800',
  form: 'bg-gray-100 text-gray-800',
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-gray-100 text-gray-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

const CONTEXT_OPTIONS: InboxContextOption[] = [
  { value: 'cs', label: 'Customer Support', icon: MessageSquare, description: 'Customer support conversations' },
  { value: 'sales', label: 'Sales', icon: Briefcase, description: 'Sales inquiries and leads' },
  { value: 'ops', label: 'Operations', icon: Settings, description: 'Internal operations' },
  { value: 'management', label: 'Management', icon: BarChart3, description: 'Management oversight' },
  { value: 'ai', label: 'AI Agent', icon: Bot, description: 'AI agent conversations' },
]

export function InboxList() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContext, setSelectedContext] = useState<InboxContext>('cs')
  const [availableContexts, setAvailableContexts] = useState<InboxContextOption[]>(CONTEXT_OPTIONS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    channel: '' as string,
    status: '' as string,
    assigned: '' as string,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [advancedFilters, setAdvancedFilters] = useState<any>(null)

  useEffect(() => {
    fetchAvailableContexts()
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [filters, advancedFilters, selectedContext])

  const fetchAvailableContexts = async () => {
    try {
      const response = await fetch('/api/v1/unified-inbox/contexts')
      if (response.ok) {
        const data = await response.json()
        // Filter available contexts based on user access
        const userContexts = CONTEXT_OPTIONS.filter(ctx => 
          data.data?.some((c: any) => c.context_type === ctx.value)
        )
        if (userContexts.length > 0) {
          setAvailableContexts(userContexts)
        }
      }
    } catch (error) {
      console.error('Error fetching contexts:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      
      // Use unified inbox API with context
      const params = new URLSearchParams()
      params.append('context', selectedContext)
      if (filters.channel) params.append('channel', filters.channel)
      if (filters.status) params.append('status', filters.status)
      if (filters.assigned) params.append('assigned_to', filters.assigned)
      if (searchTerm) params.append('search', searchTerm)
      params.append('page', '1')
      params.append('limit', '50')

      // Use advanced search if filters are set
      if (advancedFilters) {
        const response = await fetch('/api/v1/inbox/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...advancedFilters,
            context: selectedContext,
          }),
        })
        
        if (!response.ok) throw new Error('Failed to search conversations')
        const data = await response.json()
        setConversations(data.data.results || [])
      } else {
        // Use unified inbox API
        const response = await fetch(`/api/v1/unified-inbox?${params.toString()}`)
        if (!response.ok) {
          // Fallback to regular inbox API
          const fallbackResponse = await fetch(`/api/v1/inbox?${params.toString()}`)
          if (!fallbackResponse.ok) throw new Error('Failed to fetch conversations')
          const data = await fallbackResponse.json()
          setConversations(data.conversations || [])
        } else {
          const data = await response.json()
          setConversations(data.data?.conversations || [])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdvancedSearch = (searchFilters: any) => {
    setAdvancedFilters(searchFilters)
    setSearchTerm(searchFilters.query || '')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchConversations()
  }

  const handleRowClick = (conversation: Conversation) => {
    // Use query param for split view, or navigate to detail page
    const useSplitView = window.innerWidth >= 1024 // Only on desktop
    if (useSplitView) {
      router.push(`/dashboard/inbox?id=${conversation.conversation_id}`)
    } else {
      router.push(`/dashboard/inbox/${conversation.conversation_id}`)
    }
  }

  const columns: Column<Conversation>[] = [
    {
      key: 'channel',
      label: 'Channel',
      sortable: true,
      render: (value, row) => {
        const Icon = CHANNEL_ICONS[row.channel]
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <Badge className={CHANNEL_COLORS[row.channel]}>
              {row.channel.toUpperCase()}
            </Badge>
          </div>
        )
      },
    },
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.customer_name || row.customer_email}
          </div>
          <div className="text-sm text-gray-500">{row.customer_email}</div>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (value, row) => (
        <div className="max-w-md">
          <div className="font-medium text-gray-900 truncate">
            {row.subject || 'No subject'}
          </div>
          {row.last_message_preview && (
            <div className="text-sm text-gray-500 truncate mt-1">
              {row.last_message_preview}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <Badge className={STATUS_COLORS[row.status]}>
          {row.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value, row) => (
        <Badge className={PRIORITY_COLORS[row.priority]}>
          {row.priority.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'assigned_to_name',
      label: 'Assigned To',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.assigned_to_name ? (
            <>
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">{row.assigned_to_name}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'last_message_at',
      label: 'Last Activity',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(row.last_message_at), { addSuffix: true })}
          </span>
        </div>
      ),
    },
    {
      key: 'unread_count',
      label: 'Unread',
      sortable: true,
      render: (value, row) => (
        row.unread_count > 0 ? (
          <Badge className="bg-red-100 text-red-800">
            {row.unread_count}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      ),
    },
  ]

  if (loading) {
    return <div className="text-center py-12">Loading conversations...</div>
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Context Switcher */}
      <Card className="p-3 lg:p-4">
        <div className="flex flex-wrap gap-2">
          {availableContexts.map((context) => {
            const Icon = context.icon
            return (
              <button
                key={context.value}
                onClick={() => setSelectedContext(context.value)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-0',
                  selectedContext === context.value
                    ? 'bg-active text-active-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                )}
                title={context.description}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{context.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Advanced Search */}
      <AdvancedSearch onSearch={handleAdvancedSearch} initialFilters={advancedFilters} />

      {/* Legacy Search and Filters (hidden if advanced search is used) */}
      {!advancedFilters && (
      <Card className="p-3 lg:p-4">
        <form onSubmit={handleSearch} className="space-y-3 lg:space-y-4">
          <div className="flex gap-2 lg:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 touch-manipulation"
                />
              </div>
            </div>
            <Button type="submit" className="touch-manipulation min-h-[44px] sm:min-h-0">
              <span className="hidden sm:inline">Search</span>
              <Search className="h-4 w-4 sm:hidden" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="hidden sm:inline">Filters:</span>
            </div>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm touch-manipulation flex-1 sm:flex-none"
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">Call</option>
              <option value="chat">Chat</option>
              <option value="facebook">Facebook</option>
              <option value="form">Form</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm touch-manipulation flex-1 sm:flex-none"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filters.assigned}
              onChange={(e) => setFilters({ ...filters, assigned: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm touch-manipulation flex-1 sm:flex-none"
            >
              <option value="">All Assignments</option>
              <option value="unassigned">Unassigned</option>
              <option value="me">Assigned to Me</option>
            </select>

            {(filters.channel || filters.status || filters.assigned) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ channel: '', status: '', assigned: '' })}
                className="touch-manipulation"
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedIds={selectedIds}
          onActionComplete={() => {
            setSelectedIds([])
            fetchConversations()
          }}
        />
      )}

      {/* Conversations List - Mobile Card View / Desktop Table */}
      <div className="space-y-2">
        {/* Desktop: Select All */}
        <div className="hidden sm:flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={selectedIds.length === conversations.length && conversations.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(conversations.map((c) => c.conversation_id))
                } else {
                  setSelectedIds([])
                }
              }}
              className="rounded border-gray-300 w-4 h-4 touch-manipulation"
            />
            <span>Select All</span>
          </label>
        </div>

        {/* Mobile: Card View */}
        <div className="sm:hidden space-y-3">
          {conversations.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No conversations found</p>
            </Card>
          ) : (
            conversations.map((conversation) => {
              const ChannelIcon = CHANNEL_ICONS[conversation.channel]
              return (
                <Card
                  key={conversation.conversation_id}
                  className="p-4 touch-manipulation active:bg-gray-50"
                  onClick={() => handleRowClick(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(conversation.conversation_id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, conversation.conversation_id])
                        } else {
                          setSelectedIds(selectedIds.filter((id) => id !== conversation.conversation_id))
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 w-5 h-5 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <ChannelIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <Badge className={cn('text-xs', CHANNEL_COLORS[conversation.channel])}>
                          {conversation.channel.toUpperCase()}
                        </Badge>
                        <Badge className={cn('text-xs', STATUS_COLORS[conversation.status])}>
                          {conversation.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs ml-auto">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 mb-1 truncate">
                        {conversation.customer_name || conversation.customer_email}
                      </div>
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {conversation.subject || conversation.last_message_preview || 'No subject'}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}</span>
                        </div>
                        {conversation.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{conversation.assigned_to_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Desktop: Virtualized Table View */}
        <div className="hidden sm:block">
          <Card className="p-0 overflow-hidden">
            <div className="rounded-lg border border-border bg-background-secondary overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === conversations.length && conversations.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(conversations.map((c) => c.conversation_id))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                        className="rounded border-border w-4 h-4"
                      />
                    </TableHead>
                    {columns.map((col) => (
                      <TableHead key={col.key as string} className={col.sortable ? 'cursor-pointer hover:bg-background-secondary/50' : ''}>
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                {conversations.length > 50 ? (
                  <div className="h-[600px] overflow-auto">
                    <VirtualizedList
                      items={conversations}
                      estimateSize={60}
                      containerClassName="h-full"
                      renderItem={(conversation, index) => (
                        <tr
                          key={conversation.conversation_id}
                          className="hover:bg-background-secondary/50 cursor-pointer border-b border-border"
                          onClick={() => handleRowClick(conversation)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(conversation.conversation_id)}
                              onChange={(e) => {
                                e.stopPropagation()
                                if (e.target.checked) {
                                  setSelectedIds([...selectedIds, conversation.conversation_id])
                                } else {
                                  setSelectedIds(selectedIds.filter((id) => id !== conversation.conversation_id))
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-border w-4 h-4"
                            />
                          </td>
                          {columns.map((col) => (
                            <td key={col.key as string} className="px-4 py-3 text-sm text-foreground">
                              {col.render
                                ? col.render(conversation[col.key as keyof Conversation], conversation)
                                : String(conversation[col.key as keyof Conversation] || '')}
                            </td>
                          ))}
                        </tr>
                      )}
                    />
                  </div>
                ) : (
                  <TableBody>
                    {conversations.map((conversation) => (
                      <TableRow
                        key={conversation.conversation_id}
                        className="hover:bg-background-secondary/50 cursor-pointer"
                        onClick={() => handleRowClick(conversation)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(conversation.conversation_id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, conversation.conversation_id])
                              } else {
                                setSelectedIds(selectedIds.filter((id) => id !== conversation.conversation_id))
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-border w-4 h-4"
                          />
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.key as string}>
                            {col.render
                              ? col.render(conversation[col.key as keyof Conversation], conversation)
                              : String(conversation[col.key as keyof Conversation] || '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
