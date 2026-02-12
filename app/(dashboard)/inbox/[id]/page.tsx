import { Suspense } from 'react'
import { ConversationDetail } from '@/components/inbox/ConversationDetail'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Loading } from '@/components/shared/Loading'

export default function ConversationPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Conversation</h1>
          <Breadcrumbs
            items={[
              { label: 'Inbox', href: '/dashboard/inbox' },
              { label: 'Conversation', href: `/dashboard/inbox/${params.id}` },
            ]}
            className="mt-2"
          />
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        <ConversationDetail conversationId={params.id} />
      </Suspense>
    </div>
  )
}
