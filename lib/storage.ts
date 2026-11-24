import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Short-lived signed URL for a file in a private bucket. Call only after the caller was authorised. */
export async function signedUrl(bucket: string, path: string, seconds = 3600): Promise<string | null> {
  const db = createAdminClient();
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, seconds);
  if (error) {
    console.error(`[storage] could not sign ${bucket}/${path}:`, error.message);
    return null;
  }
  return data.signedUrl;
}

/** Splits a Supabase public object URL into bucket and path. Returns null for other URLs. */
export function parsePublicUrl(url: string): { bucket: string; path: string } | null {
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length).split("?")[0];
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  return { bucket: rest.slice(0, slash), path: decodeURIComponent(rest.slice(slash + 1)) };
}
