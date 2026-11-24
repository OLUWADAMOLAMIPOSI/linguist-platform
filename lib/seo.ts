import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings } from "@/lib/data";
import { isConfigured, siteUrl } from "@/lib/env";

interface MetaInput {
  path: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  noindex?: boolean;
}

/**
 * Builds page metadata. Per-page overrides saved in the admin SEO module (seo_pages)
 * win over the values supplied by the page, which win over the site defaults.
 */
export async function buildMetadata(input: MetaInput): Promise<Metadata> {
  if (!isConfigured()) return { title: "Setup required" };

  const settings = await getSettings();
  const db = createPublicClient();
  const { data: override } = await db.from("seo_pages").select("*").eq("path", input.path).maybeSingle();

  const siteName: string = settings.site_name ?? "Linguist Portfolio";
  const title: string | undefined = override?.title || input.title || settings.default_meta_title || undefined;
  const description: string | undefined =
    override?.description || input.description || settings.default_meta_description || settings.tagline || undefined;
  const image: string | undefined = override?.og_image_url || input.image || settings.og_image_url || undefined;
  const canonical: string = override?.canonical_url || `${siteUrl()}${input.path === "/" ? "" : input.path}`;
  const noindex = Boolean(override?.noindex || input.noindex || settings.noindex_site);

  return {
    title: title ?? siteName,
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: title ?? siteName,
      description,
      url: canonical,
      siteName,
      type: input.type ?? "website",
      publishedTime: input.publishedTime ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: title ?? siteName,
      description,
      images: image ? [image] : undefined,
    },
  };
}
