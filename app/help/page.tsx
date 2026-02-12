/**
 * Help Landing Page
 * 
 * Similar to Vercel's /help page
 * Provides support resources and "Start Chat" button
 */

'use client'

import { useState } from 'react'
import { HelpCircle, MessageSquare, BookOpen, Users, ArrowRight, LogIn } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function HelpPage() {
  const { isSignedIn, user } = useUser()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleStartChat = () => {
    if (isSignedIn) {
      // Redirect to support chat
      window.location.href = '/support'
    } else {
      // Show login prompt
      setShowLoginPrompt(true)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-[#2563eb]" />
              <span className="text-xl font-semibold text-gray-900">TrueVow Help</span>
            </Link>
            {isSignedIn ? (
              <Link
                href="/support"
                className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Start Chat
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Find answers, get support, or chat with our team
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Knowledge Base */}
          <div className="p-6 border border-gray-200 rounded-lg hover:border-[#2563eb] transition-colors">
            <BookOpen className="h-8 w-8 text-[#2563eb] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Base</h3>
            <p className="text-sm text-gray-600 mb-4">
              Browse articles and guides to find answers to common questions
            </p>
            <Link
              href="/knowledge-base"
              className="text-[#2563eb] hover:text-[#1d4ed8] text-sm font-medium flex items-center gap-1"
            >
              Browse articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Community */}
          <div className="p-6 border border-gray-200 rounded-lg hover:border-[#2563eb] transition-colors">
            <Users className="h-8 w-8 text-[#2563eb] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect with other users and get help from the community
            </p>
            <Link
              href="/community"
              className="text-[#2563eb] hover:text-[#1d4ed8] text-sm font-medium flex items-center gap-1"
            >
              Join community
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Chat Support */}
          <div className="p-6 border-2 border-[#2563eb] rounded-lg bg-[#2563eb]/5">
            <MessageSquare className="h-8 w-8 text-[#2563eb] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat with Support</h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe your issue and we&apos;ll help you resolve it
            </p>
            {isSignedIn ? (
              <Link
                href="/support"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                Start Chat
              </Link>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  You must be logged in to chat with support
                </p>
                <Link
                  href="/sign-in?redirect=/support"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f2937] text-white rounded-lg hover:bg-[#111827] transition-colors text-sm font-medium"
                >
                  <LogIn className="h-4 w-4" />
                  Log in to chat
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Help */}
        <div className="text-center text-sm text-gray-500">
          <p>
            If you do not have an account or you are unable to log in,{' '}
            <Link href="/contact" className="text-[#2563eb] hover:underline">
              discover alternative help here
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
