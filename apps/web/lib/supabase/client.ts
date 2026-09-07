'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Browser client — uses the public anon key only. Every query made with this
// client is subject to the Row-Level Security policies in
// supabase/schema.sql, so a learner can only ever read/write their own rows.
// Never import the service-role key here.

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
        'Copy .env.example to .env.local and fill in the Supabase project values.'
    )
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  return browserClient
}
