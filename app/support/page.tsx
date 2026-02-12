/**
 * External Customer Support Page
 * 
 * Full-page chat interface (like ChatGPT/Claude)
 * Separate from customer portal for security (LLM connection)
 * No floating widgets - dedicated support experience
 */

'use client'

import { CustomerSupportChat } from '@/components/support/CustomerSupportChat'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <CustomerSupportChat />
    </div>
  )
}
