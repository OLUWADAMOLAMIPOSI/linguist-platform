import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { isConfigured, siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPaths = ["", "/about", "/research", "/publications", "/teaching", "/blog", "/languages", "/languages/map", "/phonetics", "/syntax", "/dictionary", "/corpus", "/audio", "/contact"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
  if (!isConfigured()) return entries;

  try {
    const db = createPublicClient();
    const [{ data: settings }, projects, pubs, posts, langs, words, collections, recordings] = await Promise.all([
      db.from("website_settings").select("noindex_site").eq("id", 1).maybeSingle(),
      db.from("research_projects").select("slug, updated_at"),
      db.from("publications").select("slug, updated_at"),
      db.from("blog_posts").select("slug, updated_at"),
      db.from("languages").select("slug, updated_at"),
      db.from("dictionary_entries").select("id, updated_at").limit(5000),
      db.from("corpus_collections").select("slug, updated_at"),
      db.from("audio_recordings").select("id, updated_at"),
    ]);
    if (settings?.noindex_site) return [];

    const add = (rows: { updated_at?: string; [k: string]: unknown }[] | null, prefix: string, key: string) =>
      (rows ?? []).forEach((r) =>
        entries.push({ url: `${base}${prefix}/${r[key]}`, lastModified: r.updated_at ? new Date(r.updated_at) : undefined, priority: 0.6 })
      );
    add(projects.data, "/research", "slug");
    add(pubs.data, "/publications", "slug");
    add(posts.data, "/blog", "slug");
    add(langs.data, "/languages", "slug");
    add(words.data, "/dictionary", "id");
    add(collections.data, "/corpus", "slug");
    add(recordings.data, "/audio", "id");
  } catch (err) {
    console.error("[sitemap]", err instanceof Error ? err.message : err);
  }
  return entries;
}
