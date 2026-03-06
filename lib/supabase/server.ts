import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Server-side client with service role — bypasses RLS, server-only
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Anon client for server components (respects RLS)
export function createServerAnonClient() {
  return createSupabaseClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
}
