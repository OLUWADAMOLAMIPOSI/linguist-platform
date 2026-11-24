import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { isConfigured, siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let noindex = false;
  let extra: string[] = [];
  if (isConfigured()) {
    try {
      const db = createPublicClient();
      const { data } = await db.from("website_settings").select("noindex_site, robots_extra").eq("id", 1).maybeSingle();
      noindex = Boolean(data?.noindex_site);
      extra = (data?.robots_extra ?? "")
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => /^Disallow:/i.test(l))
        .map((l: string) => l.replace(/^Disallow:\s*/i, ""))
        .filter(Boolean);
    } catch (err) {
      console.error("[robots]", err instanceof Error ? err.message : err);
    }
  }
  return {
    rules: noindex ? [{ userAgent: "*", disallow: "/" }] : [{ userAgent: "*", allow: "/", disallow: ["/admin", "/newsletter", ...extra] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
