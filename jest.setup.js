// Jest setup file
// This file runs before each test file

// Node.js 18+ has native fetch, no polyfill needed

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://inbwimykrvmxhlmwxamk.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYndpbXlrcnZteGhsbXd4YW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTM2NTEsImV4cCI6MjA4MTA2OTY1MX0.CJ8Tgo6g6o8sW26Nvj7hNLXOi9nDrNVE45W1TmbQHoI'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYndpbXlrcnZteGhsbXd4YW1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5MzY1MSwiZXhwIjoyMDgxMDY5NjUxfQ.EEncizYr07qEr_WShCjsrRkGbGqMsUAvgrpzoigC8YE'

// Global test helper to check if database tests should run
global.shouldRunDatabaseTests = async () => {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data, error } = await client.from('cs_tickets').select('count').limit(1)
    return !error && data !== undefined
  } catch (e) {
    return false
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/test-path'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-clerk-user-id',
    sessionId: 'test-session-id',
    getToken: jest.fn(() => Promise.resolve('test-token')),
  })),
  currentUser: jest.fn(() => Promise.resolve({
    id: 'test-clerk-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })),
}))

// Suppress console errors in tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// }
