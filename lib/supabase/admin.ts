import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service role client. Bypasses Row Level Security. SERVER ONLY.
 * Never import this from a client component. Only use it after you have validated the input
 * and (where relevant) confirmed the caller is staff.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (and to your Vercel environment variables)."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
