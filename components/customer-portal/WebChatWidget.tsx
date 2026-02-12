/**
 * WebChat Widget Component
 * 
 * Customer-facing live chat widget with voice calling capability
 * Features:
 * - Preconfigured support engagement options
 * - Voice agent integration (speech-to-text, text-to-speech)
 * - Real-time voice conversation transcript display
 * - Research-based blue color scheme
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Minimize2, Maximize2, Phone, PhoneCall, Loader2, Mic, MicOff, Volume2, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface WebChatWidgetProps {
  tenantId?: string
  customerEmail?: string
  customerId?: string
  position?: 'bottom-right' | 'bottom-left'
  enableVoice?: boolean // Enable voice calling features
  engagementOptions?: Array<{
    label: string
    value: string
    icon?: string
  }>
}

// Default preconfigured support options
const DEFAULT_SUPPORT_OPTIONS = [
  { label: 'Technical Support', value: 'technical' },
  { label: 'Billing Question', value: 'billing' },
  { label: 'Account Help', value: 'account' },
  { label: 'Chat with AI Support Agent', value: 'ai_agent', icon: '✨' },
]

export function WebChatWidget({
  tenantId,
  customerEmail,
  customerId,
  position = 'bottom-right',
  enableVoice = true,
  engagementOptions = DEFAULT_SUPPORT_OPTIONS,
}: WebChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showCallOptions, setShowCallOptions] = useState(false)
  const [showEngagementOptions, setShowEngagementOptions] = useState(true)
  const [selectedEngagement, setSelectedEngagement] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [requestingCallback, setRequestingCallback] = useState(false)
  
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
    if (isOpen && !sessionId && !showEngagementOptions) {
      createSession()
    }
  }, [isOpen, showEngagementOptions])

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

  const createSession = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/webchat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: customerEmail,
          customer_id: customerId,
          tenant_id: tenantId,
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
      }
    } catch (error) {
      console.error('Error creating chat session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/v1/webchat/${sessionId}/messages`)
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
      const response = await fetch(`/api/v1/webchat/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: messageToSend,
          from_type: 'customer',
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
      formData.append('from_type', 'customer')

      const response = await fetch(`/api/v1/webchat/${sessionId}/voice`, {
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

  const requestCallback = async () => {
    if (!phoneNumber.replace(/\D/g, '').match(/^\d{10}$/)) {
      alert('Please enter a valid 10-digit phone number')
      return
    }

    try {
      setRequestingCallback(true)
      const response = await fetch('/api/v1/customer-portal/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber.replace(/\D/g, ''),
          customer_email: customerEmail,
          customer_id: customerId,
          tenant_id: tenantId,
          conversation_id: sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([
          ...messages,
          {
            message_id: data.data.message_id,
            conversation_id: sessionId,
            from_type: 'customer',
            body: `Callback requested for ${phoneNumber}`,
            created_at: new Date().toISOString(),
          },
        ])
        setPhoneNumber('')
        setShowCallOptions(false)
        alert('Callback request received! An agent will call you shortly.')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to request callback')
      }
    } catch (error) {
      console.error('Error requesting callback:', error)
      alert('Failed to request callback. Please try again.')
    } finally {
      setRequestingCallback(false)
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
        aria-label="Open chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
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
          <span className="font-semibold">Chat with us</span>
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
          {enableVoice && !isMinimized && (
            <button
              onClick={() => setShowCallOptions(!showCallOptions)}
              className="hover:bg-[#1d4ed8] rounded p-1 transition-colors"
              title="Request callback"
            >
              <Phone className="h-4 w-4" />
            </button>
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
          {/* Call Options Panel */}
          {showCallOptions && enableVoice && (
            <div className="p-4 border-b bg-[#f9fafb]">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Request a Callback
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="flex-1 rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#111827] focus:border-[#2563eb] focus:outline-none"
                      disabled={requestingCallback}
                    />
                    <button
                      onClick={requestCallback}
                      disabled={requestingCallback || !phoneNumber.replace(/\D/g, '').match(/^\d{10}$/)}
                      className="px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {requestingCallback ? (
                        <PhoneCall className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#6b7280] mt-1">
                    An agent will call you at this number
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Options or Messages */}
          {showEngagementOptions ? (
            /* Preconfigured Support Options */
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <HelpCircle className="h-8 w-8 mx-auto mb-2 text-[#2563eb]" />
                  <p className="text-sm text-[#6b7280] mb-2">How can we help you today?</p>
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
                    <p className="text-sm">We&apos;ll respond as soon as possible</p>
                    {enableVoice && (
                      <button
                        onClick={() => setShowCallOptions(true)}
                        className="mt-4 px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] transition-colors text-sm flex items-center gap-2 mx-auto"
                      >
                        <Phone className="h-4 w-4" />
                        Request Callback
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Voice transcript (if active) */}
                    {isVoiceMode && voiceTranscript && (
                      <div className="p-3 rounded-lg max-w-[80%] ml-auto bg-[#dbeafe] text-right">
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
                          msg.from_type === 'customer'
                            ? 'bg-[#f3f4f6] ml-auto text-right' // Customer: Light grey
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
