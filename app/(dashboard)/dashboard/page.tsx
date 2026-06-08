/**
 * CSM Dashboard Page
 * 
 * Main dashboard for Customer Success Managers
 * Focuses on POST-ONBOARDING customer management and health tracking
 * 
 * NOTE: Client Success Managers manage customers AFTER they've completed onboarding and gone live.
 * Onboarding workflows are handled by client_onboarding_manager role in SaaS Admin service.
 */

import { CustomerSuccessDashboard } from '@/components/cs-support/dashboard/OnboardingDashboard'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Onboarding Management Dashboard</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Manage customer onboarding pipeline and escalations
        </p>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard/dashboard' },
          ]}
          className="mt-2"
        />
      </div>
      <CustomerSuccessDashboard />
    </div>
  )
}
