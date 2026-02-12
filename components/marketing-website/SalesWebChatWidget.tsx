/**
 * Sales WebChat Widget Component
 * 
 * Marketing website widget for PROSPECTS/LEADS (NOT customer support)
 * Features:
 * - Preconfigured engagement options
 * - Voice agent integration (speech-to-text, text-to-speech)
 * - Real-time voice conversation transcript display
 * - Research-based blue color scheme
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Minimize2, Maximize2, Loader2, AlertCircle, Mic, MicOff, Volume2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SalesWebChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left'
  apiBaseUrl?: string // CS-Support service API URL
  engagementOptions?: Array<{
    label: string
    value: string
    icon?: string
  }>
}

// Default preconfigured engagement options
const DEFAULT_ENGAGEMENT_OPTIONS = [
  { label: 'Get a Demo', value: 'demo' },
  { label: 'Pricing', value: 'pricing' },
  { label: 'Product Tour', value: 'product_tour' },
  { label: 'Chat with our AI Virtual Rep', value: 'ai_agent', icon: '✨' },
]

export function SalesWebChatWidget({
  position = 'bottom-right',
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cs-support.truevow.com',
  engagementOptions = DEFAULT_ENGAGEMENT_OPTIONS,
}: SalesWebChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [prospectEmail, setProspectEmail] = useState('')
  const [prospectName, setProspectName] = useState('')
  const [showEmailPrompt, setShowEmailPrompt] = useState(true)
  const [showEngagementOptions, setShowEngagementOptions] = useState(false)
  const [selectedEngagement, setSelectedEngagement] = useState<string | null>(null)
  const [isCustomer, setIsCustomer] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  
  // Voice agent state
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !sessionId && !showEmailPrompt && !showEngagementOptions) {
      createSession()
    }
  }, [isOpen, showEmailPrompt, showEngagementOptions])

  useEffect(() => {
    if (sessionId) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, voiceTranscript])

  // Initialize Web Speech API for voice
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setVoiceTranscript(prev => prev + finalTranscript)
          sendVoiceMessage(finalTranscript.trim())
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }
  }, [])

  const checkCustomer = async (email: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/sales-webchat/check-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data?.is_customer) {
          setIsCustomer(true)
          setRedirectUrl(data.data.redirect_url || '/customer-portal/support')
          return true
        }
      }
    } catch (error) {
      console.error('Error checking customer status:', error)
    }
    return false
  }

  const createSession = async () => {
    if (!prospectEmail) return

    // Check if existing customer first
    const isExistingCustomer = await checkCustomer(prospectEmail)
    if (isExistingCustomer) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/v1/sales-webchat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_email: prospectEmail,
          prospect_name: prospectName,
          engagement_type: selectedEngagement,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.data?.conversation_id)
        setShowEngagementOptions(false)
        
        // If AI agent selected, start voice mode
        if (selectedEngagement === 'ai_agent') {
          setIsVoiceMode(true)
        }
      } else if (response.status === 302) {
        const error = await response.json()
        setIsCustomer(true)
        setRedirectUrl(error.details?.redirect_url || '/customer-portal/support')
      }
    } catch (error) {
      console.error('Error creating sales chat session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/sales-webchat/${sessionId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data || [])
        
        // Check for voice transcriptions in messages
        const voiceMessages = data.data?.filter((m: any) => m.metadata?.is_voice_transcript)
        if (voiceMessages?.length > 0) {
          // Voice conversation is active
          setIsVoiceMode(true)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (text?: string) => {
    const messageToSend = text || messageText
    if (!messageToSend.trim() || !sessionId || sending) return

    try {
      setSending(true)
      const response = await fetch(`${apiBaseUrl}/api/v1/sales-webchat/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: messageToSend,
          from_type: 'prospect',
          is_voice: isVoiceMode && !text, // Auto-detected voice if in voice mode
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.data])
        setMessageText('')
        setVoiceTranscript('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const sendVoiceMessage = async (transcript: string) => {
    if (!transcript.trim() || !sessionId) return
    await sendMessage(transcript)
  }

  const startVoiceListening = async () => {
    if (!sessionId) {
      alert('Please start a chat session first')
      return
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start()
        setIsListening(true)
      } else {
        // Fallback: Use MediaRecorder API
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await sendVoiceAudio(audioBlob)
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setIsListening(true)
      }
    } catch (error) {
      console.error('Error starting voice recording:', error)
      alert('Microphone access denied. Please enable microphone permissions.')
    }
  }

  const stopVoiceListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }

  const sendVoiceAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice.webm')
      formData.append('conversation_id', sessionId!)
      formData.append('from_type', 'prospect')

      const response = await fetch(`${apiBaseUrl}/api/v1/sales-webchat/${sessionId}/voice`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Voice transcript will be added as message
        await fetchMessages()
      }
    } catch (error) {
      console.error('Error sending voice audio:', error)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prospectEmail) return

    const isExistingCustomer = await checkCustomer(prospectEmail)
    if (!isExistingCustomer) {
      setShowEmailPrompt(false)
      setShowEngagementOptions(true)
    }
  }

  const handleEngagementSelect = (value: string) => {
    setSelectedEngagement(value)
    createSession()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          // Research-based blue: #2563eb (trust, professionalism)
          'fixed z-50 w-14 h-14 rounded-full bg-[#2563eb] text-white shadow-lg hover:bg-[#1d4ed8] transition-colors flex items-center justify-center',
          position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
        )}
        aria-label="Chat with sales"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  // Show redirect message for existing customers
  if (isCustomer && redirectUrl) {
    return (
      <div
        className={cn(
          'fixed z-50 bg-white rounded-lg shadow-2xl flex flex-col',
          position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6',
          'w-96 h-auto'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b bg-[#2563eb] text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Existing Customer</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-[#1d4ed8] rounded p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          <p className="mb-4 text-[#374151]">
            You&apos;re already a TrueVow customer! For support, please visit our customer portal.
          </p>
          <a
            href={redirectUrl}
            className="inline-block px-6 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] transition-colors"
          >
            Go to Customer Portal
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed z-50 bg-white rounded-lg shadow-2xl flex flex-col',
        position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6',
        isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
      )}
    >
      {/* Header - Research-based blue */}
      <div className="flex items-center justify-between p-4 border-b bg-[#2563eb] text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">Chat with Sales</span>
        </div>
        <div className="flex items-center gap-2">
          {isVoiceMode && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs',
              isListening ? 'bg-[#1d4ed8]' : 'bg-white/20'
            )}>
              {isListening ? (
                <>
                  <Mic className="h-3 w-3 animate-pulse" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3" />
                  <span>Voice</span>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-[#1d4ed8] rounded p-1 transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-[#1d4ed8] rounded p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Email Prompt */}
          {showEmailPrompt ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center py-8">
                <h3 className="font-semibold mb-2 text-[#111827]">Let&apos;s get started!</h3>
                <p className="text-sm text-[#6b7280] mb-4">
                  Enter your email to start chatting with our sales team
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={prospectEmail}
                    onChange={(e) => setProspectEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] focus:border-[#2563eb] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] focus:border-[#2563eb] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !prospectEmail}
                    className="w-full px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      'Start Chat'
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : showEngagementOptions ? (
            /* Preconfigured Engagement Options */
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <p className="text-sm text-[#6b7280] mb-2">Welcome to TrueVow!</p>
                  <p className="text-sm font-medium text-[#111827]">How can we help you today?</p>
                </div>
                {engagementOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleEngagementSelect(option.value)}
                    disabled={loading}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg text-white font-medium text-sm transition-colors',
                      'bg-[#1f2937] hover:bg-[#111827] disabled:opacity-50 disabled:cursor-not-allowed',
                      'flex items-center justify-center gap-2'
                    )}
                  >
                    {option.icon && <span>{option.icon}</span>}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {loading ? (
                  <div className="text-center py-8 text-[#6b7280]">Connecting...</div>
                ) : messages.length === 0 && !voiceTranscript ? (
                  <div className="text-center py-8 text-[#6b7280]">
                    <p className="mb-2 text-[#374151]">Start a conversation</p>
                    <p className="text-sm">Our sales team will respond shortly</p>
                  </div>
                ) : (
                  <>
                    {/* Voice transcript (if active) */}
                    {isVoiceMode && voiceTranscript && (
                      <div className="p-3 rounded-lg max-w-[80%] ml-auto bg-[#f3f4f6] text-right">
                        <div className="text-sm text-[#1f2937]">{voiceTranscript}</div>
                        <div className="text-xs text-[#6b7280] mt-1 flex items-center justify-end gap-1">
                          <Mic className="h-3 w-3" />
                          <span>Speaking...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Regular messages */}
                    {messages.map((msg) => (
                      <div
                        key={msg.message_id}
                        className={cn(
                          'p-3 rounded-lg max-w-[80%]',
                          msg.from_type === 'prospect' || msg.from_type === 'customer'
                            ? 'bg-[#dbeafe] ml-auto text-right' // Customer: Light blue
                            : 'bg-[#f3f4f6]' // Agent: Light gray
                        )}
                      >
                        <div className="text-sm text-[#1f2937]">{msg.body}</div>
                        {msg.metadata?.is_voice_transcript && (
                          <div className="text-xs text-[#6b7280] mt-1 flex items-center gap-1">
                            <Volume2 className="h-3 w-3" />
                            <span>Voice conversation</span>
                          </div>
                        )}
                        <div className="text-xs text-[#6b7280] mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4 bg-[#f9fafb] rounded-b-lg">
                {isVoiceMode ? (
                  /* Voice Mode Controls */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isListening ? stopVoiceListening : startVoiceListening}
                      className={cn(
                        'px-4 py-2 rounded transition-colors flex items-center gap-2',
                        isListening
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                      )}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span className="text-sm">Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span className="text-sm">Speak</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsVoiceMode(false)}
                      className="px-4 py-2 bg-[#e5e7eb] text-[#374151] rounded hover:bg-[#d1d5db] transition-colors text-sm"
                    >
                      Switch to Text
                    </button>
                  </div>
                ) : (
                  /* Text Input */
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] focus:border-[#2563eb] focus:outline-none"
                      disabled={sending || !sessionId}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={sending || !messageText.trim() || !sessionId}
                      className="px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                    {sessionId && (
                      <button
                        onClick={() => setIsVoiceMode(true)}
                        className="px-4 py-2 bg-[#e5e7eb] text-[#374151] rounded hover:bg-[#d1d5db] transition-colors"
                        title="Switch to voice"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
