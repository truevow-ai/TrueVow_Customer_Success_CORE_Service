/**
 * Unified Communication Panel
 * 
 * Integrates unified voice, webchat, and dialer into conversation view
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Dialer } from '../inbox/Dialer'
import { Phone, MessageSquare, Video, Send, Loader2 } from 'lucide-react'

interface UnifiedCommunicationPanelProps {
  conversationId: string
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  channel?: string
}

export function UnifiedCommunicationPanel({
  conversationId,
  customerPhone,
  customerEmail,
  customerName,
  channel,
}: UnifiedCommunicationPanelProps) {
  const [activeTab, setActiveTab] = useState<'dialer' | 'chat' | 'voice'>('dialer')

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 w-full">
          <button
            onClick={() => setActiveTab('dialer')}
            className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'dialer'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Dialer</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'voice'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>
      </div>

      {activeTab === 'dialer' && (
        <Dialer
          conversationId={conversationId}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          customerName={customerName}
        />
      )}

      {activeTab === 'chat' && (
        <WebChatPanel conversationId={conversationId} />
      )}

      {activeTab === 'voice' && (
        <VoicePanel conversationId={conversationId} />
      )}
    </Card>
  )
}

/**
 * WebChat Panel Component
 */
function WebChatPanel({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Fetch messages on mount
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/v1/webchat/${conversationId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [conversationId])

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return

    try {
      setSending(true)
      const response = await fetch(`/api/v1/webchat/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: messageText,
          from_type: 'agent',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.data])
        setMessageText('')
      }
    } catch (error) {
      console.error('Error sending chat message:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="h-64 overflow-y-auto border rounded p-3 space-y-2 bg-gray-50">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`p-2 rounded max-w-[85%] ${
                msg.from_type === 'agent' ? 'bg-blue-100 ml-auto text-right' : 'bg-white'
              }`}
            >
              <div className="text-sm">{msg.body}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
          placeholder="Type a message..."
          className="flex-1"
          disabled={sending}
        />
        <Button onClick={sendMessage} disabled={sending || !messageText.trim()} size="sm">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Voice Panel Component
 */
function VoicePanel({ conversationId }: { conversationId: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="font-medium">Voice Call Features</p>
        <p className="text-sm mt-2">Coming soon</p>
        <p className="text-xs text-gray-400 mt-1">
          Voice calls are handled via the Dialer tab
        </p>
      </div>
    </div>
  )
}
