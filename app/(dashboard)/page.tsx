import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/shared/Card'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          CS-Support Service Dashboard
        </h1>
        <p className="text-sm text-foreground-secondary mb-4">
          Welcome to the Customer Support dashboard.
        </p>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
          ]}
          className="mt-2"
        />
      </div>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Getting Started</h2>
        <ul className="list-disc list-inside space-y-2 text-foreground">
          <li>Configure your Clerk environment variables</li>
          <li>Set up your Supabase database connection</li>
          <li>Review the implementation plan in <code className="bg-background-secondary px-2 py-1 rounded text-foreground">docs/CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md</code></li>
        </ul>
      </Card>
    </div>
  )
}

