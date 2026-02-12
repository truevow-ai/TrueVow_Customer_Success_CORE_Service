'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { optimisticUpdate } from '@/lib/utils/optimistic-update'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/components/shared/Badge'
import { Input } from '@/components/shared/Input'
import { Form, FormField, FormLabel } from '@/components/shared/Form'
import {
  Mail,
  MessageSquare,
  Phone,
  User,
  Clock,
  Tag,
  Send,
  Paperclip,
  Sparkles,
  File,
  FileText,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { TagsManager } from './TagsManager'
import { NotesPanel } from './NotesPanel'
import { CannedResponses } from './CannedResponses'
import { SLAIndicator } from './SLAIndicator'
import { CustomerProfile } from './CustomerProfile'
import { ActivityFeed } from './ActivityFeed'
import { AttachmentUpload, Attachment } from './AttachmentUpload'
import { AISuggestions } from './AISuggestions'
import { Dialer } from './Dialer'
import { UnifiedCommunicationPanel } from '../unified-inbox/UnifiedCommunicationPanel'
import { TranscriptionViewer } from './TranscriptionViewer'
import { CRMSyncStatus } from './CRMSyncStatus'
import { MentionsAutocomplete } from './MentionsAutocomplete'
import { SharedDraftIndicator } from './SharedDraftIndicator'
import { ConversationSummary } from './ConversationSummary'
import { ActiveUsersIndicator } from '../unified-inbox/ActiveUsersIndicator'

interface Message {
  message_id: string
  ticket_id: string
  from_type: 'customer' | 'agent' | 'system'
  from_user_id: string | null
  sender_id: string
  sender_type: 'agent' | 'customer' | 'system'
  body: string
  is_internal: boolean
  attachments: Record<string, any>
  created_at: string
}

interface ConversationData {
  conversation: {
    conversation_id: string
    channel: 'email' | 'sms' | 'call' | 'chat' | 'facebook' | 'form'
    customer_email: string
    customer_name: string | null
    status: 'active' | 'archived' | 'closed'
    assigned_to: string | null
    tags: string[] | null
    last_message_at: string
    created_at: string
  }
  ticket: {
    ticket_id: string
    subject: string
    status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    assigned_to: string | null
    sla_first_response_target: string | null
    sla_resolution_target: string | null
    resolved_at: string | null
    created_at: string
  } | null
  messages: Message[]
}

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  chat: MessageSquare,
  facebook: MessageSquare,
  form: MessageSquare,
}

export function ConversationDetail({ conversationId }: { conversationId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [data, setData] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [teamMembers, setTeamMembers] = useState<Array<{ value: string; label: string; role: string }>>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [showCannedResponses, setShowCannedResponses] = useState(false)
  const [showCustomerProfile, setShowCustomerProfile] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false) // Mobile sidebar toggle

  useEffect(() => {
    fetchConversation()
    fetchTeamMembers()
    fetchSharedDraft()
    
    // Mark as viewing when conversation loads
    markAsViewing()
    
    // Set up interval to keep marking as viewing
    const viewingInterval = setInterval(markAsViewing, 10000) // Every 10 seconds
    
    return () => {
      clearInterval(viewingInterval)
    }
  }, [conversationId])

  const markAsViewing = async () => {
    try {
      await fetch(`/api/v1/collision/${conversationId}/viewing`, {
        method: 'POST',
      })
    } catch (error) {
      // Silently fail - collision detection is not critical
      console.debug('Error marking as viewing:', error)
    }
  }

  const markAsTyping = async () => {
    try {
      await fetch(`/api/v1/collision/${conversationId}/typing`, {
        method: 'POST',
      })
    } catch (error) {
      // Silently fail - collision detection is not critical
      console.debug('Error marking as typing:', error)
    }
  }

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/inbox/${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch conversation')
      
      const result = await response.json()
      setData(result.data)
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      setLoadingTeamMembers(true)
      const response = await fetch('/api/v1/team-members')
      if (!response.ok) throw new Error('Failed to fetch team members')
      
      const result = await response.json()
      setTeamMembers(result.data.teamMembers || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoadingTeamMembers(false)
    }
  }

  const fetchSharedDraft = async () => {
    try {
      setLoadingDraft(true)
      const response = await fetch(`/api/v1/inbox/${conversationId}/shared-draft`)
      if (response.ok) {
        const result = await response.json()
        setSharedDraft(result.data)
      }
    } catch (error) {
      console.error('Error fetching shared draft:', error)
    } finally {
      setLoadingDraft(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const response = await fetch(`/api/v1/inbox/${conversationId}/shared-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: replyText,
          shared_with_team: 'all',
          editable_by_all: true,
          existing_draft_id: sharedDraft?.draft_id,
        }),
      })
      if (!response.ok) throw new Error('Failed to save draft')
      const result = await response.json()
      setSharedDraft(result.data)
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const handleGenerateCopilot = async () => {
    try {
      setShowCopilot(true)
      const response = await fetch(`/api/v1/inbox/${conversationId}/copilot`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to generate draft')
      const result = await response.json()
      setReplyText(result.data.draft)
      if (result.data.subject && data?.ticket) {
        // Update ticket subject if provided
      }
    } catch (error) {
      console.error('Error generating copilot draft:', error)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !data?.ticket) return

    try {
      setSending(true)
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        message_id: `temp-${Date.now()}`,
        ticket_id: data.ticket.ticket_id,
        from_type: 'agent',
        from_user_id: null,
        sender_id: 'current-user',
        sender_type: 'agent',
        body: replyText,
        is_internal: false,
        attachments: attachments.reduce((acc, att) => {
          acc[att.id] = { filename: att.filename, url: att.url, size: att.size, type: att.type }
          return acc
        }, {} as Record<string, any>),
        created_at: new Date().toISOString(),
      }

      const updatedData = optimisticUpdate({
        currentData: data,
        updateFn: (current) => ({
          ...current!,
          messages: [...(current?.messages || []), optimisticMessage],
        }),
        apiCall: async () => {
          const response = await fetch(`/api/v1/inbox/${conversationId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              body: replyText,
              attachments: attachments.map((att) => ({
                id: att.id,
                filename: att.filename,
                url: att.url,
                size: att.size,
                type: att.type,
              })),
            }),
          })
          if (!response.ok) throw new Error('Failed to send reply')
          return response.json()
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Message sent',
            description: 'Your reply has been sent successfully.',
          })
          setReplyText('')
          setAttachments([])
          fetchConversation() // Refresh to get actual message from server
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to send',
            description: error.message || 'Please try again.',
          })
        },
      })

      setData(updatedData)
    } catch (error) {
      console.error('Error sending reply:', error)
      showToast({
        type: 'error',
        title: 'Failed to send',
        description: 'Please try again.',
      })
    } finally {
      setSending(false)
    }
  }

  const handleAssign = async (teamMemberId: string) => {
    if (!data) return

    try {
      const updatedData = await optimisticUpdate({
        currentData: data,
        updateFn: (current) => ({
          ...current!,
          conversation: {
            ...current!.conversation,
            assigned_to: teamMemberId,
          },
        }),
        apiCall: async () => {
          const response = await fetch(`/api/v1/inbox/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_to: teamMemberId }),
          })
          if (!response.ok) throw new Error('Failed to assign conversation')
          return response.json()
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Assigned',
            description: 'Conversation has been assigned successfully.',
          })
          fetchConversation() // Refresh to get actual data
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to assign',
            description: error.message || 'Please try again.',
          })
        },
      })

      setData(updatedData)
    } catch (error) {
      console.error('Error assigning conversation:', error)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!data?.ticket) return

    try {
      const updatedData = await optimisticUpdate({
        currentData: data,
        updateFn: (current) => ({
          ...current!,
          ticket: current!.ticket ? {
            ...current!.ticket,
            status: status as any,
          } : null,
        }),
        apiCall: async () => {
          const response = await fetch(`/api/v1/inbox/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
          if (!response.ok) throw new Error('Failed to update status')
          return response.json()
        },
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Status updated',
            description: 'Ticket status has been updated.',
          })
          fetchConversation() // Refresh to get actual data
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Failed to update',
            description: error.message || 'Please try again.',
          })
        },
      })

      setData(updatedData)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleTagsChange = async (newTags: string[]) => {
    try {
      const response = await fetch(`/api/v1/inbox/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })

      if (!response.ok) throw new Error('Failed to update tags')
      await fetchConversation()
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading conversation...</div>
  }

  if (!data) {
    return <div className="text-center py-12">Conversation not found</div>
  }

  const { conversation, ticket, messages } = data
  const ChannelIcon = CHANNEL_ICONS[conversation.channel]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4 lg:space-y-6">
      {/* Conversation Header */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <ChannelIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500 flex-shrink-0" />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
                {ticket?.subject || 'No subject'}
              </h2>
              <ActiveUsersIndicator conversationId={conversationId} className="ml-auto" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="truncate">{conversation.customer_name || conversation.customer_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 lg:h-4 lg:w-4" />
                <span>
                  {formatDistanceToNow(new Date(conversation.last_message_at || conversation.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            <Badge className="text-xs">{conversation.status.toUpperCase()}</Badge>
            {ticket && <Badge className="text-xs">{ticket.priority.toUpperCase()}</Badge>}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={conversation.assigned_to || ''}
            onChange={(e) => handleAssign(e.target.value)}
            disabled={loadingTeamMembers}
            className="rounded-md border border-gray-300 px-3 py-2.5 text-sm disabled:opacity-50 touch-manipulation"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label} ({member.role})
              </option>
            ))}
          </select>
          <select
            value={conversation.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2.5 text-sm touch-manipulation"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="closed">Closed</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </Card>

      {/* Conversation Summary */}
      <ConversationSummary conversationId={conversationId} />

      {/* AI Suggestions for Last Customer Message */}
      {messages.length > 0 && messages[messages.length - 1].sender_type === 'customer' && (
        <AISuggestions
          messageId={messages[messages.length - 1].message_id}
          onSuggestionSelect={(suggestion) => setReplyText(suggestion)}
        />
      )}

      {/* Shared Draft Indicator */}
      <SharedDraftIndicator
        conversationId={conversationId}
        draft={sharedDraft}
        onLoadDraft={(draft) => {
          setReplyText(draft.body)
          // Scroll to reply form
          setTimeout(() => {
            const replyForm = document.querySelector('textarea')
            replyForm?.focus()
          }, 100)
        }}
        onDraftUpdate={(draft) => {
          setSharedDraft(draft)
        }}
        onDiscard={async () => {
          await fetch(`/api/v1/inbox/${conversationId}/shared-draft`, { method: 'DELETE' })
          setSharedDraft(null)
        }}
      />

      {/* Messages Thread */}
      <Card className="p-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No messages yet</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.message_id}
                className={cn(
                  'flex gap-4 p-4 rounded-lg',
                  message.sender_type === 'agent' ? 'bg-blue-50' : 'bg-gray-50'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {message.sender_type === 'agent' ? 'Agent' : 'Customer'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {message.is_internal && (
                      <Badge className="bg-yellow-100 text-yellow-800">Internal</Badge>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{message.body}</p>
                  
                  {/* Show transcription viewer for call messages */}
                  {message.metadata?.transcription && (
                    <div className="mt-3">
                      <TranscriptionViewer
                        messageId={message.message_id}
                        transcription={{
                          message_id: message.message_id,
                          ticket_id: message.ticket_id,
                          ticket_subject: ticket?.subject || null,
                          customer_email: conversation.customer_email,
                          transcription_text: message.body,
                          confidence: message.metadata.transcription.confidence || 0,
                          duration: message.metadata.transcription.duration || 0,
                          speakers: message.metadata.transcription.speakers,
                          recording_url: message.metadata.recordingUrl || message.metadata.recording_url,
                          call_id: message.metadata.callId || message.metadata.call_id,
                          created_at: message.created_at,
                        }}
                      />
                    </div>
                  )}

                  {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att: any, idx: number) => (
                        <a
                          key={idx}
                          href={att.url || att.filename}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <File className="h-4 w-4" />
                          {att.filename || 'Attachment'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Tags Manager */}
      <Card className="p-6">
        <TagsManager
          tags={conversation.tags || []}
          onTagsChange={handleTagsChange}
        />
      </Card>

      {/* Notes Panel */}
      {ticket && <NotesPanel ticketId={ticket.ticket_id} onNoteAdded={fetchConversation} />}

      {/* Reply Form */}
      {ticket && (
        <Card className="p-4 lg:p-6">
          <Form onSubmit={handleReply}>
            <FormField>
              <FormLabel>Reply</FormLabel>
              <div className="space-y-2">
                <MentionsAutocomplete
                  text={replyText}
                  onTextChange={(text) => {
                    setReplyText(text)
                    // Mark as typing when user types
                    if (text.length > 0) {
                      markAsTyping()
                    }
                  }}
                  teamMembers={teamMembers.map((m) => ({
                    member_id: m.value,
                    clerk_user_id: m.label,
                    role: m.role,
                    metadata: {
                      name: m.label, // Use label as name for now
                      email: '', // TODO: Fetch from user profile
                    },
                  }))}
                  onMentionSelect={(member) => {
                    // Mention selected - could trigger notification
                    console.log('Mentioned:', member)
                  }}
                />
                <AttachmentUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  disabled={sending}
                />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCannedResponses(!showCannedResponses)}
                      className="touch-manipulation min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
                    >
                      <FileText className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Templates</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleGenerateCopilot}
                      disabled={showCopilot}
                      className="touch-manipulation min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
                    >
                      <Sparkles className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{showCopilot ? 'Generating...' : 'AI Copilot'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveDraft}
                      className="touch-manipulation min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Save Draft</span>
                      <span className="sm:hidden">Draft</span>
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!replyText.trim() || sending}
                    className="touch-manipulation min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send Reply'}</span>
                    <span className="sm:hidden">{sending ? 'Sending...' : 'Send'}</span>
                  </Button>
                </div>
              </div>
            </FormField>
          </Form>
          {showCannedResponses && (
            <div className="mt-4">
              <CannedResponses
                onSelect={(content) => {
                  setReplyText(content)
                  setShowCannedResponses(false)
                }}
                onClose={() => setShowCannedResponses(false)}
              />
            </div>
          )}
        </Card>
      )}
      </div>

      {/* Sidebar */}
      <div className={`space-y-4 lg:space-y-6 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
        {/* Unified Communication Panel - Dialer, Chat, Voice */}
        <UnifiedCommunicationPanel
          conversationId={conversation.conversation_id}
          customerPhone={conversation.customer_email} // May contain phone for SMS/call
          customerEmail={conversation.customer_email}
          customerName={conversation.customer_name}
          channel={conversation.channel}
        />

        {/* CRM Sync Status */}
        {ticket && (
          <CRMSyncStatus
            ticketId={ticket.ticket_id}
            onSyncComplete={fetchConversation}
          />
        )}

        {/* SLA Indicator */}
        {ticket && (
          <Card className="p-4">
            <SLAIndicator
              firstResponseTarget={ticket.sla_first_response_target || null}
              resolutionTarget={ticket.sla_resolution_target || null}
              firstResponseAt={null} // TODO: Get from ticket metadata
              resolvedAt={ticket.resolved_at || null}
              createdAt={ticket.created_at}
            />
          </Card>
        )}

        {/* Customer Profile */}
        {showCustomerProfile && (
          <CustomerProfile
            customerEmail={conversation.customer_email}
            customerName={conversation.customer_name}
            tenantId={data?.ticket?.tenant_id || null}
          />
        )}

        {/* Activity Feed */}
        {ticket && <ActivityFeed ticketId={ticket.ticket_id} />}
      </div>
    </div>
  )
}
