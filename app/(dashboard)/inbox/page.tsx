'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { InboxList } from '@/components/inbox/InboxList'
import { ConversationDetail } from '@/components/inbox/ConversationDetail'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Loading } from '@/components/shared/Loading'
import { SplitView } from '@/components/ui/split-view'

function InboxPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedConversationId = searchParams.get('id')
  const [isDesktop, setIsDesktop] = useState(false)

  // Check if desktop on mount and handle resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Shared Inbox</h1>
          <Breadcrumbs
            items={[
              { label: 'Inbox', href: '/dashboard/inbox' },
            ]}
            className="mt-2"
          />
        </div>
      </div>

      {selectedConversationId && isDesktop ? (
        <div className="h-[calc(100vh-200px)]">
          <SplitView
            left={
              <div className="h-full overflow-auto">
                <InboxList />
              </div>
            }
            right={
              <div className="h-full overflow-auto">
                <Suspense fallback={<Loading />}>
                  <ConversationDetail conversationId={selectedConversationId} />
                </Suspense>
              </div>
            }
            leftWidth="40%"
            rightWidth="60%"
            className="h-full"
          />
        </div>
      ) : (
        <Suspense fallback={<Loading />}>
          <InboxList />
        </Suspense>
      )}
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InboxPageContent />
    </Suspense>
  )
}
