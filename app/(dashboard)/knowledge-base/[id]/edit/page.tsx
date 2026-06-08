import { Suspense } from 'react'
import { KBArticleEditor } from '@/components/kb/KBArticleEditor'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Loading } from '@/components/shared/Loading'

export default async function EditKBArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Knowledge Base', href: '/dashboard/knowledge-base' },
          { label: 'Edit Article', href: '#' },
        ]}
      />

      <Suspense fallback={<Loading />}>
        <KBArticleEditor articleId={id} />
      </Suspense>
    </div>
  )
}
