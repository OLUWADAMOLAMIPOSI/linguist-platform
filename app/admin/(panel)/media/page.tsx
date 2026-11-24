import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { MediaManager, type MediaItem } from "@/components/admin/media-manager";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  await requireStaff();
  const supabase = createClient();
  const { data, error } = await supabase.from("media_files").select("id, name, url, mime_type, size_bytes, created_at").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(`Loading media: ${error.message}`);

  return (
    <div className="max-w-6xl">
      <p className="eyebrow mb-1">Site</p>
      <h1 className="mb-2 text-3xl">Media library</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Upload images, documents and audio, then copy a file&apos;s link to use it anywhere in your content. Files attached directly to a
        publication, project or recording are stored separately.
      </p>
      <MediaManager items={(data ?? []) as MediaItem[]} />
    </div>
  );
}
