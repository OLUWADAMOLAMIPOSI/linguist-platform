import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous client with no session. Used for public pages: it only ever sees what the
 * public Row Level Security policies allow.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
