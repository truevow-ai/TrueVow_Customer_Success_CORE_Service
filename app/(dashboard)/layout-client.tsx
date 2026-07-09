/**
 * Client-side Dashboard Layout
 * 
 * Handles dynamic navigation state and secondary nav positioning
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { PrimaryNav } from '@/components/navigation/PrimaryNav'
import { SecondaryNav } from '@/components/navigation/SecondaryNav'
import { Header } from '@/components/layout/Header'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Softphone } from '@/components/softphone/Softphone'

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(true)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const activeModule = pathname?.split('/')[2] || null
    setSelectedModule(activeModule)
    setMobileNavOpen(false)
  }, [pathname])

  const toggleMobileNav = useCallback(() => setMobileNavOpen(v => !v), [])

  const contentMarginLeft = isMobile
    ? '0'
    : isPrimaryCollapsed
      ? (selectedModule ? '320px' : '64px')
      : (selectedModule ? '512px' : '256px')

  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="flex h-screen bg-background">
          <div className={cn(
            isMobile ? (mobileNavOpen ? 'fixed inset-0 z-50 flex' : 'hidden') : 'flex'
          )}>
            {isMobile ? (
              <>
                <div className="flex">
                  <PrimaryNav onModuleSelect={setSelectedModule} />
                  <SecondaryNav config={null} isPrimaryCollapsed={isPrimaryCollapsed} />
                </div>
                <button
                  onClick={toggleMobileNav}
                  className="fixed top-4 right-4 z-50 rounded-full bg-background border p-2 shadow-lg md:hidden"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <PrimaryNav onModuleSelect={setSelectedModule} />
                <SecondaryNav config={null} isPrimaryCollapsed={isPrimaryCollapsed} />
              </>
            )}
          </div>
          <div
            className="flex flex-1 flex-col overflow-hidden transition-all duration-200"
            style={{ marginLeft: contentMarginLeft }}
          >
            <Header
              onMobileMenuToggle={isMobile ? toggleMobileNav : undefined}
            />
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 text-foreground">
              {children}
            </main>
          </div>
        </div>
        <Softphone />
      </ErrorBoundary>
    </ToastProvider>
  )
}
