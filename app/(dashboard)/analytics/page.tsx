import { AnalyticsDashboard } from '@/components/analytics/Dashboard'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <Breadcrumbs
          items={[
            { label: 'Analytics', href: '/dashboard/analytics' },
          ]}
          className="mt-2"
        />
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
