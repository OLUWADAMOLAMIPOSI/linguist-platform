import { createClient } from "@/lib/supabase/client";

export interface UploadOptions {
  bucket: string;
  isPublic: boolean;
  accept: string[];
  maxMB: number;
  /** When true, also records the file in the media library table. */
  record?: boolean;
}

export type UploadOutcome =
  | { ok: true; value: string; name: string; url: string }
  | { ok: false; error: string };

function extension(name: string, mime: string): string {
  const fromName = name.includes(".") ? name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  if (fromName && fromName.length <= 5) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg",
    "application/pdf": "pdf", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg",
  };
  return map[mime] ?? "bin";
}

/**
 * Uploads a file from the browser to Supabase Storage using the signed-in staff session.
 * Returns the public URL for public buckets, or the storage path for private buckets.
 */
export async function uploadFromBrowser(file: File, opts: UploadOptions): Promise<UploadOutcome> {
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > opts.maxMB * 1024 * 1024) {
    return { ok: false, error: `That file is larger than the ${opts.maxMB} MB limit for this field.` };
  }
  if (!opts.accept.includes(file.type)) {
    return { ok: false, error: `This file type (${file.type || "unknown"}) is not allowed here.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };

  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${extension(file.name, file.type)}`;
  const { error } = await supabase.storage.from(opts.bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { ok: false, error: `Upload failed: ${error.message}` };

  const url = opts.isPublic ? supabase.storage.from(opts.bucket).getPublicUrl(path).data.publicUrl : "";

  if (opts.record) {
    const { error: dbError } = await supabase.from("media_files").insert({
      name: file.name,
      bucket: opts.bucket,
      path,
      url,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    });
    if (dbError) {
      await supabase.storage.from(opts.bucket).remove([path]);
      return { ok: false, error: `Could not record the upload: ${dbError.message}` };
    }
  }

  return { ok: true, value: opts.isPublic ? url : path, name: file.name, url };
}
