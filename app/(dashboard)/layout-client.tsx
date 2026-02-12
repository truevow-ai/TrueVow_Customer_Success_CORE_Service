/**
 * Client-side Dashboard Layout
 * 
 * Handles dynamic navigation state and secondary nav positioning
 */

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PrimaryNav } from '@/components/navigation/PrimaryNav'
import { SecondaryNav } from '@/components/navigation/SecondaryNav'
import { Header } from '@/components/layout/Header'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(true)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  // Detect module from pathname
  useEffect(() => {
    const activeModule = pathname?.split('/')[2] || null
    setSelectedModule(activeModule)
  }, [pathname])

  // Calculate content margin
  const contentMarginLeft = isPrimaryCollapsed
    ? (selectedModule ? '320px' : '64px')      // 64px + 256px if secondary shown
    : (selectedModule ? '512px' : '256px')     // 256px + 256px if secondary shown

  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="flex h-screen bg-background">
          <PrimaryNav onModuleSelect={setSelectedModule} />
          <SecondaryNav config={null} isPrimaryCollapsed={isPrimaryCollapsed} />
          <div
            className="flex flex-1 flex-col overflow-hidden transition-all duration-200"
            style={{ marginLeft: contentMarginLeft }}
          >
            <Header />
            <main className="flex-1 overflow-y-auto bg-background p-6 text-foreground">
              {children}
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </ToastProvider>
  )
}
