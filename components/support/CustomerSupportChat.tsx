/**
 * Customer Support Chat Component
 * 
 * Vercel-inspired full-page chat interface
 * Features:
 * - Login requirement (like Vercel)
 * - Service/product dropdowns (INTAKE, VERIFY, DRAFT, SETTLE, CONNECT)
 * - Account selection dropdown
 * - Subscription-based service availability
 * - Create case option for escalation
 * - Voice chat support
 * - AI agent guardrails integration
 * - Professional, empathetic responses
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Mic, MicOff, Volume2, HelpCircle, ChevronDown, FileText, LogIn } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  is_voice?: boolean
  showDropdowns?: boolean
  showCreateCase?: boolean
}

interface ServiceSubscription {
  service: string
  is_subscribed: boolean
  label: string
}

// TrueVow Services (in order: INTAKE → VERIFY → DRAFT → SETTLE → CONNECT)
const TRUEVOW_SERVICES: Array<{ value: string; label: string; icon: string }> = [
  { value: 'INTAKE', label: 'INTAKE', icon: '📥' },
  { value: 'VERIFY', label: 'VERIFY', icon: '✓' },
  { value: 'DRAFT', label: 'DRAFT', icon: '📄' },
  { value: 'SETTLE', label: 'SETTLE', icon: '💰' },
  { value: 'CONNECT', label: 'CONNECT', icon: '🔗' },
]

export function CustomerSupportChat() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({})
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [showCreateCasePrompt, setShowCreateCasePrompt] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Check login status
  useEffect(() => {
    if (!isSignedIn) {
      // Redirect to login with return URL
      router.push('/sign-in?redirect=/support')
    }
  }, [isSignedIn, router])

  // Fetch subscriptions and accounts on mount
  useEffect(() => {
    if (isSignedIn && user) {
      fetchSubscriptions()
      fetchAccounts()
    }
  }, [isSignedIn, user])

  // Initialize with welcome message (like Vercel)
  useEffect(() => {
    if (isSignedIn && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello, I'm an AI assistant from TrueVow. If we find something we can't solve, I'll help create a support case for you. Which product are you inquiring about?",
          timestamp: new Date().toISOString(),
          showDropdowns: true,
        },
      ])
    }
  }, [isSignedIn, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, voiceTranscript])

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        if (finalTranscript) {
          setVoiceTranscript(prev => prev + finalTranscript)
          handleSendMessage(finalTranscript.trim(), true)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }
  }, [])

  const fetchSubscriptions = async () => {
    try {
      // TODO: Get tenant_id from user context
      const response = await fetch('/api/v1/customers/subscriptions?tenant_id=placeholder')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.data?.subscriptions || {})
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      // Default: INTAKE always available
      setSubscriptions({ INTAKE: true, VERIFY: false, DRAFT: false, SETTLE: false, CONNECT: false })
    }
  }

  const fetchAccounts = async () => {
    try {
      // TODO: Fetch user's accounts/projects from Platform Service
      // For now, use mock data
      setAccounts([
        { id: 'account-1', name: `${user?.emailAddresses[0]?.emailAddress || 'user'}'s projects` },
      ])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const handleServiceSelect = (service: string) => {
    setSelectedService(service)
    setShowServiceDropdown(false)

    // Check if service is subscribed
    if (!subscriptions[service] && service !== 'INTAKE') {
      // Show message that service requires subscription
      const subscriptionMessage: ChatMessage = {
        id: `subscription-${Date.now()}`,
        role: 'assistant',
        content: `I see you're interested in ${service} support. This service requires an active subscription. INTAKE is available now. Would you like to continue with INTAKE support, or would you like to learn more about subscribing to ${service}?`,
        timestamp: new Date().toISOString(),
        showCreateCase: true,
      }
      setMessages(prev => [...prev, subscriptionMessage])
      return
    }

    // Ask for account selection
    const accountMessage: ChatMessage = {
      id: `account-prompt-${Date.now()}`,
      role: 'assistant',
      content: `Thank you. Can you also let me know which account are you inquiring about?`,
      timestamp: new Date().toISOString(),
      showDropdowns: true,
    }
    setMessages(prev => [...prev, accountMessage])
  }

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId)
    setShowAccountDropdown(false)

    // Ask for problem description
    const problemMessage: ChatMessage = {
      id: `problem-prompt-${Date.now()}`,
      role: 'assistant',
      content: `What's the problem?`,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, problemMessage])
  }

  const handleCreateCase = async () => {
    setIsLoading(true)
    try {
      // Create support case via API
      const response = await fetch('/api/v1/support/create-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Support case from chat - ${selectedService || 'General'}`,
          description: `Customer requested escalation. Service: ${selectedService || 'N/A'}, Account: ${selectedAccount || 'N/A'}`,
          service: selectedService,
          account: selectedAccount,
          conversation_id: sessionId,
          priority: 'high',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const caseMessage: ChatMessage = {
          id: `case-${Date.now()}`,
          role: 'assistant',
          content: `I've created a support case (#${data.data?.ticket_id}) for you. Our human support team will investigate this issue and get back to you. You'll receive updates via email. Is there anything else I can help you with?`,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, caseMessage])
        setShowCreateCasePrompt(false)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create support case')
      }
    } catch (error) {
      console.error('Error creating case:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (text?: string, isVoice = false) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      is_voice: isVoice,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setVoiceTranscript('')
    setIsLoading(true)

    // Send to API with guardrails
    if (sessionId) {
      try {
        const response = await fetch(`/api/v1/webchat/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: messageText,
            from_type: 'customer',
            is_voice: isVoice,
            service: selectedService,
            account: selectedAccount,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          await fetchMessages()
        }
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }

    // Get agent response with guardrails (professional, empathetic, specific)
    // First tries FAQ repository (Tier 1), then falls back to hardcoded responses
    getAgentResponse(messageText, selectedService).then((agentResponse) => {
      const agentMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: agentResponse.content,
        timestamp: new Date().toISOString(),
        showCreateCase: agentResponse.shouldEscalate,
      }
      setMessages(prev => [...prev, agentMessage])
      setIsLoading(false)
    }).catch((error) => {
      console.error('Error getting agent response:', error)
      // Fallback response on error
      const agentMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question, or would you like me to create a support case for you?`,
        timestamp: new Date().toISOString(),
        showCreateCase: true,
      }
      setMessages(prev => [...prev, agentMessage])
      setIsLoading(false)
    })
  }

  const getAgentResponse = async (query: string, service: string): Promise<{ content: string; shouldEscalate: boolean }> => {
    // First, try to find a matching FAQ (Tier 1: Rule-Based FAQ Agent)
    try {
      const response = await fetch('/api/v1/faqs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category: service ? service.toLowerCase() : undefined,
          min_confidence: 0.6,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data?.faq && data.data.confidence >= 0.6) {
          // Found a matching FAQ - use it
          return {
            content: data.data.formatted_answer || data.data.faq.answer,
            shouldEscalate: false,
          }
        }
      }
    } catch (error) {
      console.error('Error searching FAQs:', error)
      // Continue to fallback responses
    }

    // Fallback: Professional, empathetic, specific responses (like Vercel)
    const lowerQuery = query.toLowerCase()

    // Check for escalation triggers
    if (lowerQuery.includes('refund') && lowerQuery.includes('not appear')) {
      return {
        content: `I understand your frustration - it's definitely concerning that refunds haven't appeared on your credit card statement after this time. Unfortunately, TrueVow support cannot directly intervene in bank-level refund processing or force refunds to appear on your statement, as this involves coordination between our payment processor and your financial institution. Your best path forward is to create a support case so our team can investigate this with our payment processor and track down what happened. Would you like me to help you create a support case?`,
        shouldEscalate: true,
      }
    }

    // Specific, helpful responses
    if (lowerQuery.includes('cannot') || lowerQuery.includes("can't") || lowerQuery.includes('unable')) {
      return {
        content: `I understand you're experiencing an issue. Let me help you troubleshoot this. Can you provide more details about what specifically isn't working? This will help me diagnose the problem more accurately.`,
        shouldEscalate: false,
      }
    }

    // Default professional response
    return {
      content: `I understand you're asking about "${query}". Let me help you with that. ${service ? `Since you're inquiring about ${service}, I can provide specific guidance.` : ''} Can you provide a bit more detail so I can assist you more effectively?`,
      shouldEscalate: false,
    }
  }

  const fetchMessages = async () => {
    if (!sessionId) return
    try {
      const response = await fetch(`/api/v1/webchat/${sessionId}/messages`)
      if (response.ok) {
        const data = await response.json()
        // Update messages from API
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const startVoiceListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopVoiceListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Show login prompt if not signed in
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8">
        <div className="max-w-md w-full text-center">
          <HelpCircle className="h-16 w-16 text-[#2563eb] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">You must be logged in to chat with support</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access our support chat
          </p>
          <Link
            href="/sign-in?redirect=/support"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1f2937] text-white rounded-lg hover:bg-[#111827] transition-colors"
          >
            <LogIn className="h-5 w-5" />
            Log in to chat
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            If you do not have an account or you are unable to log in,{' '}
            <Link href="/contact" className="text-[#2563eb] hover:underline">
              discover alternative help here
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header - Minimal, Clean */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-[#2563eb]" />
              <h1 className="text-xl font-semibold text-gray-900">Chat with support</h1>
            </div>
            {isVoiceMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563eb]/10 text-[#2563eb] text-sm">
                {isListening ? (
                  <>
                    <Mic className="h-4 w-4 animate-pulse" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>Voice Mode</span>
                  </>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">Describe your issue and we&apos;ll help you resolve it</p>
        </div>
      </div>

      {/* Chat Area - Full Height */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-white" />
                  </div>
                )}

                <div className={cn(
                  'flex flex-col max-w-[80%]',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  <div className={cn(
                    'rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-[#f3f4f6] text-[#1f2937]'
                      : 'bg-[#f3f4f6] text-[#1f2937]'
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.is_voice && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Mic className="h-3 w-3" />
                        <span>Voice</span>
                      </div>
                    )}
                  </div>

                  {/* Service/Account Dropdowns (like Vercel) */}
                  {message.showDropdowns && (
                    <div className="mt-3 space-y-3 w-full">
                      {/* Service Dropdown */}
                      {!selectedService && (
                        <div className="relative">
                          <button
                            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-left flex items-center justify-between hover:border-[#2563eb] transition-colors"
                          >
                            <span className={selectedService ? 'text-gray-900' : 'text-gray-400'}>
                              {selectedService || 'Select...'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>
                          {showServiceDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                              {TRUEVOW_SERVICES.map((service) => {
                                const isSubscribed = subscriptions[service.value] || service.value === 'INTAKE'
                                return (
                                  <button
                                    key={service.value}
                                    onClick={() => handleServiceSelect(service.value)}
                                    disabled={!isSubscribed}
                                    className={cn(
                                      'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2',
                                      !isSubscribed && 'opacity-50 cursor-not-allowed'
                                    )}
                                  >
                                    <span>{service.icon}</span>
                                    <span>{service.label}</span>
                                    {!isSubscribed && (
                                      <span className="ml-auto text-xs text-gray-500">(Subscription required)</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Account Dropdown */}
                      {selectedService && !selectedAccount && (
                        <div className="relative">
                          <button
                            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-left flex items-center justify-between hover:border-[#2563eb] transition-colors"
                          >
                            <span className={selectedAccount ? 'text-gray-900' : 'text-gray-400'}>
                              {selectedAccount ? accounts.find(a => a.id === selectedAccount)?.name : 'Select...'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>
                          {showAccountDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                              {accounts.map((account) => (
                                <button
                                  key={account.id}
                                  onClick={() => handleAccountSelect(account.id)}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                >
                                  {account.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create Case Option */}
                  {message.showCreateCase && (
                    <div className="mt-3">
                      <button
                        onClick={handleCreateCase}
                        className="px-4 py-2 rounded-lg bg-[#1f2937] text-white text-sm font-medium hover:bg-[#111827] transition-colors flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Create Support Case
                      </button>
                    </div>
                  )}

                  <span className="text-xs text-gray-400 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">U</span>
                  </div>
                )}
              </div>
            ))}

            {/* Voice Transcript */}
            {isVoiceMode && voiceTranscript && (
              <div className="flex justify-end gap-4">
                <div className="flex flex-col max-w-[80%] items-end">
                  <div className="rounded-2xl px-4 py-3 bg-[#f3f4f6] text-[#1f2937]">
                    <p className="text-sm leading-relaxed">{voiceTranscript}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Mic className="h-3 w-3 animate-pulse" />
                      <span>Speaking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-white" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[#f3f4f6]">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {isVoiceMode ? (
            <div className="flex items-center gap-3">
              <button
                onClick={isListening ? stopVoiceListening : startVoiceListening}
                className={cn(
                  'px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2',
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                )}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    <span>Speak</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsVoiceMode(false)}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Switch to Text
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={selectedAccount ? "I am having trouble with..." : "Type your message..."}
                  rows={1}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent resize-none text-sm"
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                />
                <button
                  onClick={() => setIsVoiceMode(true)}
                  className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Switch to voice"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
          )}
          {/* Privacy Notice (like Vercel) */}
          <p className="text-xs text-gray-500 mt-2">
            Responses are AI-generated and may be viewed by <strong>TrueVow</strong> employees — avoid sharing sensitive information.
          </p>
        </div>
      </div>
    </div>
  )
}
