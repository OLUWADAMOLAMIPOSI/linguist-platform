import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Staff } from "@/lib/auth";

/** Records an entry in the activity log. A failure is logged to the server console, never hidden from the console. */
export async function logActivity(
  staff: Pick<Staff, "id" | "email"> | null,
  action: string,
  table: string,
  recordId: string | null,
  summary: string
): Promise<void> {
  try {
    const db = createAdminClient();
    const { error } = await db.from("activity_logs").insert({
      user_id: staff?.id ?? null,
      user_email: staff?.email ?? null,
      action,
      table_name: table,
      record_id: recordId,
      summary: summary.slice(0, 300),
    });
    if (error) console.error("[activity] insert failed:", error.message);
  } catch (err) {
    console.error("[activity] could not log:", err instanceof Error ? err.message : err);
  }
}
