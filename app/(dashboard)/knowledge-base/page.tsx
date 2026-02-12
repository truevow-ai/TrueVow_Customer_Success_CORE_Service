import { Suspense } from 'react'
import { KBArticleList } from '@/components/kb/KBArticleList'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Loading } from '@/components/shared/Loading'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'
import { Plus } from 'lucide-react'

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
          <Breadcrumbs
            items={[
              { label: 'Knowledge Base', href: '/dashboard/knowledge-base' },
            ]}
            className="mt-2"
          />
        </div>
        <Link href="/dashboard/knowledge-base/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      <Suspense fallback={<Loading />}>
        <KBArticleList />
      </Suspense>
    </div>
  )
}
