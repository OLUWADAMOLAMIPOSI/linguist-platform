import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

function visitorHash(): string {
  const h = headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") ?? "";
  const salt = process.env.RATE_LIMIT_SALT ?? "linguist";
  return createHash("sha256").update(`${salt}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

/**
 * Database backed rate limit. Returns true when the visitor may continue.
 * The raw IP address is never stored, only a salted hash.
 */
export async function allowRequest(form: string, max = 5, windowMinutes = 15): Promise<boolean> {
  const db = createAdminClient();
  const bucket = `${form}:${visitorHash()}`;
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count, error } = await db
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);
  if (error) throw new Error(`Rate limit check failed: ${error.message}`);
  if ((count ?? 0) >= max) return false;

  const { error: insertError } = await db.from("rate_limit_events").insert({ bucket });
  if (insertError) throw new Error(`Rate limit record failed: ${insertError.message}`);

  // Opportunistic cleanup of old events
  if (Math.random() < 0.05) {
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await db.from("rate_limit_events").delete().lt("created_at", old);
  }
  return true;
}
