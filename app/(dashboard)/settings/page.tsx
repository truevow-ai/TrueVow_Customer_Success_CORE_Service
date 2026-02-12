/**
 * Settings Page
 * 
 * CS-Support service settings page with dialer configuration
 */

'use client'

import { DialerToggle } from '@/components/cs-support/dialer/DialerToggle'
import { Card } from '@/components/shared/Card'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Manage your dialer permissions and phone number configuration
        </p>
        <Breadcrumbs
          items={[
            { label: 'Settings', href: '/dashboard/settings' },
          ]}
          className="mt-2"
        />
      </div>

      {/* Dialer Settings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Dialer Settings</h2>
        <DialerToggle />
      </section>

      {/* Phone Number Configuration */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Phone Number Configuration</h2>
        <Card className="p-6">
          <p className="text-sm text-foreground-secondary">
            Customer Support uses pool numbers for outbound calls. Individual phone numbers are
            managed through the Sales CRM service if needed.
          </p>
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground">Number Assignment Type:</p>
            <p className="mt-1 text-sm text-foreground-secondary">Pool (Shared Numbers)</p>
          </div>
        </Card>
      </section>
    </div>
  )
}
