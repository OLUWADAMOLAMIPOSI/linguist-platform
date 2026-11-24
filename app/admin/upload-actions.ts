"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

/**
 * Uploads themselves happen in the browser (see lib/admin/client-upload.ts) straight to
 * Supabase Storage, because serverless functions cannot receive large audio files.
 * Storage policies and bucket limits make sure only staff can upload and that file size and
 * type limits are enforced by Supabase itself.
 */

export async function deleteMedia(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };

    const supabase = createClient();
    const { data: row, error } = await supabase.from("media_files").select("*").eq("id", id).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "That file no longer exists." };

    const rm = await supabase.storage.from(row.bucket).remove([row.path]);
    if (rm.error) return { ok: false, error: `Could not remove the file: ${rm.error.message}` };

    const { error: delError } = await supabase.from("media_files").delete().eq("id", id);
    if (delError) return { ok: false, error: delError.message };

    await logActivity(staff, "delete", "media_files", id, `Deleted ${row.name}`);
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (err) {
    console.error("[deleteMedia]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }
}
