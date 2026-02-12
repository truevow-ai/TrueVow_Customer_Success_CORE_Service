'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function UnsubscribePage() {
  const params = useParams()
  const token = params?.token as string
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid unsubscribe link')
      return
    }

    // Check current status
    fetch(`/api/v1/email/unsubscribe/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.already_unsubscribed) {
            setStatus('already')
            setMessage('You are already unsubscribed from our emails.')
          } else {
            setEmail(data.email || '')
            // Auto-unsubscribe
            handleUnsubscribe()
          }
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to process unsubscribe request')
        }
      })
      .catch((error) => {
        setStatus('error')
        setMessage('An error occurred. Please try again later.')
        console.error('Unsubscribe error:', error)
      })
  }, [token])

  const handleUnsubscribe = async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/v1/email/unsubscribe/${token}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message || 'You have been successfully unsubscribed.')
        setEmail(data.email || '')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to unsubscribe')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred. Please try again later.')
      console.error('Unsubscribe error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'success' || status === 'already'
              ? 'Unsubscribed'
              : status === 'error'
              ? 'Error'
              : 'Unsubscribing...'}
          </h1>

          {status === 'loading' && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Processing your request...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-700">{message}</p>
              {email && (
                <p className="text-sm text-gray-500 mt-2">
                  Email: <span className="font-medium">{email}</span>
                </p>
              )}
              <p className="text-sm text-gray-500 mt-4">
                You will no longer receive marketing emails from us. You may still receive important account-related communications.
              </p>
            </div>
          )}

          {status === 'already' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-700">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-gray-700">{message}</p>
              <button
                onClick={handleUnsubscribe}
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you have any questions, please contact us at{' '}
              <a href="mailto:support@truevow.com" className="text-blue-600 hover:underline">
                support@truevow.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
