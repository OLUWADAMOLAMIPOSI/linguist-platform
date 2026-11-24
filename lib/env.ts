/** True when the public Supabase variables are present. */
export function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasServiceKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
