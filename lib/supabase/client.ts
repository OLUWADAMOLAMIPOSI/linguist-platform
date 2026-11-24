import { createBrowserClient } from "@supabase/ssr";

/** Browser client. Uses the logged-in user's session, so Row Level Security applies. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
