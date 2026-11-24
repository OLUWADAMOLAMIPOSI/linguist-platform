import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server client bound to the visitor's session cookies (Row Level Security applies). */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot set cookies. The middleware refreshes the session instead,
            // so this is expected and safe to ignore here.
          }
        },
      },
    }
  );
}
