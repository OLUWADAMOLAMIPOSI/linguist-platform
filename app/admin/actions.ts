"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaff, type Staff } from "@/lib/auth";
import { getResource, type Field, type Resource } from "@/lib/admin/resources";
import { readChildren, validateFields } from "@/lib/admin/schema";
import { beforeSave } from "@/lib/admin/hooks";
import { logActivity } from "@/lib/activity";
import { parsePublicUrl } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export type ActionResult =
  | { ok: true; redirectTo?: string; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function authorize(resource: Resource): Promise<{ staff: Staff } | { error: string }> {
  const staff = await getStaff();
  if (!staff) return { error: "Your session has expired. Please sign in again." };
  if (resource.adminOnly && staff.role !== "admin") return { error: "Only administrators can change this section." };
  return { staff };
}

function friendlyDbError(message: string, code?: string): string {
  if (code === "23505" || /duplicate key/i.test(message)) {
    return "A record with the same unique value (for example the URL slug or email) already exists. Please change it and try again.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "This record is linked to other records, so the change is not allowed.";
  }
  if (code === "42501" || /row-level security/i.test(message)) {
    return "You do not have permission to make this change.";
  }
  return message;
}

async function uniqueSlug(
  supabase: ReturnType<typeof createClient>,
  table: string,
  base: string,
  excludeId: string | null
): Promise<string> {
  const root = slugify(base) || "item";
  let candidate = root;
  for (let i = 2; i < 50; i++) {
    let q = supabase.from(table).select("id").eq("slug", candidate).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export async function saveRecord(resourceKey: string, id: string | null, formData: FormData): Promise<ActionResult> {
  try {
    const resource = getResource(resourceKey);
    if (!resource) return { ok: false, error: "Unknown section." };
    const auth = await authorize(resource);
    if ("error" in auth) return { ok: false, error: auth.error };
    const { staff } = auth;

    // 1. Validate
    const { values, errors } = validateFields(resource.fields, formData);
    if (Object.keys(errors).length > 0) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors };
    }

    const childFields = resource.fields.filter((f) => f.type === "children");
    const childRows: { field: Field; rows: Record<string, unknown>[] }[] = [];
    for (const f of childFields) {
      const parsed = readChildren(f, formData);
      if (parsed.error) return { ok: false, error: parsed.error };
      childRows.push({ field: f, rows: parsed.rows });
    }

    const supabase = createClient();

    // 2. Slugs
    for (const f of resource.fields.filter((x) => x.isSlug)) {
      const current = values[f.name] as string | null;
      const source = (values[f.slugFrom ?? resource.titleField] as string | null) ?? "";
      const base = current || source;
      values[f.name] = await uniqueSlug(supabase, resource.table, base, id);
    }

    // 3. Module rules
    const checked = beforeSave(resource.key, values);
    if (checked.error) return { ok: false, error: checked.error };
    const row = checked.values;

    // 4. Singleton create guard
    if (resource.singleton && !id) {
      const { count, error } = await supabase.from(resource.table).select("*", { count: "exact", head: true });
      if (error) return { ok: false, error: friendlyDbError(error.message, error.code) };
      if ((count ?? 0) > 0) return { ok: false, error: "This section already has a record. Edit the existing one instead." };
    }

    // 5. Write the main row
    let recordId = id;
    if (id) {
      const { data, error } = await supabase.from(resource.table).update(row).eq("id", id).select("id");
      if (error) return { ok: false, error: friendlyDbError(error.message, error.code) };
      if (!data || data.length === 0) {
        return { ok: false, error: "The record could not be updated. It may have been deleted, or you may not have permission." };
      }
    } else {
      const { data, error } = await supabase.from(resource.table).insert(row).select("id").single();
      if (error) return { ok: false, error: friendlyDbError(error.message, error.code) };
      recordId = String(data.id);
    }

    // 6. Child rows (authors, collaborators, dialects, examples)
    for (const { field, rows } of childRows) {
      const spec = field.child!;
      const del = await supabase.from(spec.table).delete().eq(spec.fk, recordId);
      if (del.error) return { ok: false, error: `Saved, but ${field.label.toLowerCase()} could not be updated: ${friendlyDbError(del.error.message, del.error.code)}` };
      if (rows.length > 0) {
        const payload = rows.map((r, i) => ({ ...r, [spec.fk]: recordId, sort_order: i }));
        const ins = await supabase.from(spec.table).insert(payload);
        if (ins.error) return { ok: false, error: `Saved, but ${field.label.toLowerCase()} could not be updated: ${friendlyDbError(ins.error.message, ins.error.code)}` };
      }
    }

    // 7. Tags
    for (const f of resource.fields.filter((x) => x.type === "tags" && x.tags)) {
      const spec = f.tags!;
      const raw = String(formData.get(f.name) ?? "");
      const names = Array.from(new Set(raw.split(",").map((t) => t.trim()).filter(Boolean))).slice(0, 20);
      const tagRows = names
        .map((name) => ({ name, slug: slugify(name) }))
        .filter((t) => t.slug);
      let tagIds: string[] = [];
      if (tagRows.length > 0) {
        const up = await supabase.from(spec.tagTable).upsert(tagRows, { onConflict: "slug" }).select("id");
        if (up.error) return { ok: false, error: `Saved, but tags could not be updated: ${friendlyDbError(up.error.message, up.error.code)}` };
        tagIds = (up.data ?? []).map((t: { id: string }) => t.id);
      }
      const del = await supabase.from(spec.junction).delete().eq(spec.parentKey, recordId);
      if (del.error) return { ok: false, error: `Saved, but tags could not be updated: ${friendlyDbError(del.error.message, del.error.code)}` };
      if (tagIds.length > 0) {
        const ins = await supabase
          .from(spec.junction)
          .insert(tagIds.map((tagId) => ({ [spec.parentKey]: recordId, [spec.tagKey]: tagId })));
        if (ins.error) return { ok: false, error: `Saved, but tags could not be updated: ${friendlyDbError(ins.error.message, ins.error.code)}` };
      }
    }

    const title = String(row[resource.titleField] ?? recordId ?? "");
    await logActivity(staff, id ? "update" : "create", resource.table, recordId, `${id ? "Updated" : "Created"} ${resource.label.toLowerCase()}: ${title}`);

    revalidatePath(`/admin/${resource.key}`);
    return { ok: true, redirectTo: `/admin/${resource.key}?saved=1` };
  } catch (err) {
    console.error("[saveRecord]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected error while saving." };
  }
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionResult> {
  try {
    const resource = getResource(resourceKey);
    if (!resource) return { ok: false, error: "Unknown section." };
    if (resource.singleton) return { ok: false, error: "This record cannot be deleted." };
    const auth = await authorize(resource);
    if ("error" in auth) return { ok: false, error: auth.error };

    const supabase = createClient();
    const { data: existing, error: readError } = await supabase.from(resource.table).select("*").eq("id", id).maybeSingle();
    if (readError) return { ok: false, error: friendlyDbError(readError.message, readError.code) };
    if (!existing) return { ok: false, error: "That record no longer exists." };

    const { data, error } = await supabase.from(resource.table).delete().eq("id", id).select("id");
    if (error) return { ok: false, error: friendlyDbError(error.message, error.code) };
    if (!data || data.length === 0) return { ok: false, error: "The record could not be deleted. You may not have permission." };

    // Remove uploaded files that belonged to the record
    const toRemove: Record<string, string[]> = {};
    for (const f of resource.fields) {
      if (!f.file) continue;
      const value = existing[f.name];
      const items: string[] =
        f.type === "files" ? (Array.isArray(value) ? value.map((v: { url: string }) => v.url) : []) : value ? [String(value)] : [];
      for (const item of items) {
        if (f.file.isPublic) {
          const parsed = parsePublicUrl(item);
          if (parsed) (toRemove[parsed.bucket] ??= []).push(parsed.path);
        } else {
          (toRemove[f.file.bucket] ??= []).push(item);
        }
      }
    }
    for (const [bucket, paths] of Object.entries(toRemove)) {
      try {
        const admin = createAdminClient();
        const rm = await admin.storage.from(bucket).remove(paths);
        if (rm.error) console.error(`[deleteRecord] could not remove files from ${bucket}:`, rm.error.message);
      } catch (err) {
        console.error("[deleteRecord] file cleanup failed:", err instanceof Error ? err.message : err);
      }
    }

    await logActivity(auth.staff, "delete", resource.table, id, `Deleted ${resource.label.toLowerCase()}: ${String(existing[resource.titleField] ?? id)}`);
    revalidatePath(`/admin/${resource.key}`);
    return { ok: true };
  } catch (err) {
    console.error("[deleteRecord]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected error while deleting." };
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
