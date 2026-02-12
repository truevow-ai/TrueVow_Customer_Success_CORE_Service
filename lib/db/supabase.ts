import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side client (for use in Client Components)
export function createClientSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Server-side client (for use in Server Components and API routes)
// Uses service role to bypass RLS - all access control handled by Clerk + application code
export function createServerSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Service role client (alias for createServerSupabase - same functionality)
// All server-side operations use service role since we handle auth via Clerk
export function createServiceSupabase() {
  return createServerSupabase()
}

