import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Row } from "@/lib/utils";

type Result<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;

/** Await a Supabase query and throw a readable error instead of silently returning nothing. */
export async function must<T = any>(query: Result<T>, label: string): Promise<T> {
  const { data, error } = await query;
    if (error) {
    const hint = /fetch failed/i.test(error.message)
      ? " (cannot reach Supabase. Open /api/health to see why, and check NEXT_PUBLIC_SUPABASE_URL in .env.local)"
      : "";
    throw new Error(`${label}: ${error.message}${hint}`);
  }
  return data as T;
}

export const getSettings = cache(async (): Promise<Row> => {
  const db = createPublicClient();
  const data = await must<Row | null>(db.from("website_settings").select("*").eq("id", 1).maybeSingle(), "Loading settings");
  return data ?? { site_name: "Linguist Portfolio" };
});

export const getProfile = cache(async (): Promise<Row | null> => {
  const db = createPublicClient();
  const data = await must<Row[]>(
    db.from("profiles").select("*").order("created_at", { ascending: true }).limit(1),
    "Loading profile"
  );
  return data?.[0] ?? null;
});

export const PAGE_SIZE = 10;

export function range(page: number, size = PAGE_SIZE): [number, number] {
  const from = (page - 1) * size;
  return [from, from + size - 1];
}

export function socialLinks(settings: Row): { label: string; url: string }[] {
  const pairs: [string, string][] = [
    ["Google Scholar", "google_scholar_url"],
    ["ORCID", "orcid_url"],
    ["ResearchGate", "researchgate_url"],
    ["Academia.edu", "academia_url"],
    ["LinkedIn", "linkedin_url"],
    ["GitHub", "github_url"],
    ["Zenodo", "zenodo_url"],
    ["X / Twitter", "twitter_url"],
  ];
  return pairs
    .filter(([, key]) => Boolean(settings[key]))
    .map(([label, key]) => ({ label, url: settings[key] as string }));
}
