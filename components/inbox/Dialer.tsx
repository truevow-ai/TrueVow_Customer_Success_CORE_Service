'use client'

import { useState } from 'react'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Badge } from '@/components/shared/Badge'
import { Phone, PhoneOff, MessageSquare, Mail, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface DialerProps {
  conversationId: string
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  onCallInitiated?: (callId: string) => void
  onSMSent?: () => void
  onEmailSent?: () => void
}

export function Dialer({
  conversationId,
  customerPhone,
  customerEmail,
  customerName,
  onCallInitiated,
  onSMSent,
  onEmailSent,
}: DialerProps) {
  const [phoneNumber, setPhoneNumber] = useState(customerPhone || '')
  const [emailAddress, setEmailAddress] = useState(customerEmail || '')
  const [smsBody, setSmsBody] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'call' | 'sms' | 'email'>('call')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const handleCall = async () => {
    if (!phoneNumber.replace(/\D/g, '').match(/^\d{10}$/)) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit phone number' })
      return
    }

    try {
      setLoading(true)
      setStatus(null)

      const response = await fetch(`/api/v1/inbox/${conversationId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber.replace(/\D/g, ''),
          record: true,
          notes: callNotes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to initiate call')
      }

      const data = await response.json()
      setStatus({ type: 'success', message: 'Call initiated successfully' })
      onCallInitiated?.(data.data.call_id)
      setCallNotes('')
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to initiate call',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSMS = async () => {
    if (!phoneNumber.replace(/\D/g, '').match(/^\d{10}$/)) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit phone number' })
      return
    }

    if (!smsBody.trim()) {
      setStatus({ type: 'error', message: 'SMS body cannot be empty' })
      return
    }

    try {
      setLoading(true)
      setStatus(null)

      const response = await fetch(`/api/v1/inbox/${conversationId}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber.replace(/\D/g, ''),
          body: smsBody,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send SMS')
      }

      setStatus({ type: 'success', message: 'SMS sent successfully' })
      onSMSent?.()
      setSmsBody('')
      
      setTimeout(() => setStatus(null), 3000)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send SMS',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' })
      return
    }

    if (!emailSubject.trim() || !emailBody.trim()) {
      setStatus({ type: 'error', message: 'Email subject and body are required' })
      return
    }

    try {
      setLoading(true)
      setStatus(null)

      const response = await fetch(`/api/v1/inbox/${conversationId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailAddress,
          subject: emailSubject,
          body: emailBody,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send email')
      }

      setStatus({ type: 'success', message: 'Email sent successfully' })
      onEmailSent?.()
      setEmailSubject('')
      setEmailBody('')
      
      setTimeout(() => setStatus(null), 3000)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send email',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 lg:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Contact Customer</h3>
          {customerName && (
            <Badge className="bg-blue-100 text-blue-800">{customerName}</Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('call')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'call'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } touch-manipulation`}
          >
            <Phone className="h-4 w-4 inline mr-2" />
            Call
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sms')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } touch-manipulation`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            SMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } touch-manipulation`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Email
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`p-3 rounded-md flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{status.message}</span>
          </div>
        )}

        {/* Call Tab */}
        {activeTab === 'call' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="touch-manipulation"
                maxLength={14}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Notes (optional)
              </label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Add notes about this call..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <Button
              onClick={handleCall}
              disabled={loading || !phoneNumber.replace(/\D/g, '').match(/^\d{10}$/)}
              className="w-full touch-manipulation min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initiating...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Initiate Call
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Calls will be recorded and logged in the conversation
            </p>
          </div>
        )}

        {/* SMS Tab */}
        {activeTab === 'sms' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="touch-manipulation"
                maxLength={14}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-gray-400">({smsBody.length}/1600)</span>
              </label>
              <textarea
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                maxLength={1600}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <Button
              onClick={handleSMS}
              disabled={loading || !smsBody.trim() || !phoneNumber.replace(/\D/g, '').match(/^\d{10}$/)}
              className="w-full touch-manipulation min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                className="touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <Input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
                className="touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Type your email message..."
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <Button
              onClick={handleEmail}
              disabled={loading || !emailSubject.trim() || !emailBody.trim() || !emailAddress.includes('@')}
              className="w-full touch-manipulation min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
