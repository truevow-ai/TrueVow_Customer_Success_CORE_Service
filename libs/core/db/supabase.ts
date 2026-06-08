import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.CUSTOMER_SUCCESS_CORE_PROJECT_URL!
const supabaseAnonKey = process.env.CUSTOMER_SUCCESS_CORE_DATABASE_ANON_KEY!
const serviceRoleKey = process.env.CUSTOMER_SUCCESS_CORE_DATABASE_SERVICE_ROLE_KEY!

// Client-side client (for use in Client Components)
export function createClientSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * RLS-enforced Supabase client for user-facing operations.
 * Uses anon key + propagates Clerk user context to enable RLS.
 * 
 * This is the COMPLIANT way to access the database for user-facing operations.
 * RLS policies will enforce tenant isolation and role-based access.
 * 
 * MUST be used for ALL user-facing API routes and server components.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const { userId } = await auth()
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: userId ? {
        // Pass Clerk user ID to Supabase for RLS context
        'x-clerk-user-id': userId,
      } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  
  // Set Clerk user context for RLS policies
  // This enables the database to enforce access control
  if (userId) {
    try {
      await client.rpc('set_clerk_user_context', { p_clerk_user_id: userId })
    } catch (error) {
      // Log but don't throw - some environments may not have the function yet
      console.warn('Failed to set Clerk user context for RLS:', error)
    }
  }
  
  return client
}

/**
 * Service role client - bypasses RLS completely.
 * 
 * ⚠️ RESTRICTED USAGE - Only for:
 * - Background jobs / cron tasks
 * - Webhook handlers (external systems)
 * - System-level operations (no user context)
 * - Email processing
 * 
 * ❌ NEVER use for user-facing API operations
 * ❌ NEVER use for customer portal requests
 * ❌ NEVER use for dashboard data fetching
 * 
 * Using this for user-facing operations is an ARCHITECTURE VIOLATION.
 */
export function createServiceSupabase(): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * @deprecated Use createServiceSupabase() explicitly if you need service role.
 * This alias exists only for backward compatibility during migration.
 */
export function createServiceRoleClient(): SupabaseClient {
  return createServiceSupabase()
}

