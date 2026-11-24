import Link from "next/link";
import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHeader } from "@/components/ui/common";
import { LanguageMapLoader } from "@/components/linguistic-labs/language-map-loader";
import { VITALITY } from "@/lib/linguistics";
import type { Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/languages/map", title: "Language map", description: "Geographical distribution of documented languages." });
}

export default async function LanguageMapPage() {
  const db = createPublicClient();
  const rows = await must<Row[]>(
    db
      .from("languages")
      .select("id, name, slug, latitude, longitude, vitality, region, language_families(name)")
      .not("latitude", "is", null)
      .not("longitude", "is", null),
    "Loading map data"
  );

  const languages = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    vitality: r.vitality,
    region: r.region,
    family: r.language_families?.name ?? null,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Language documentation"
        title="Language map"
        intro="Only languages with coordinates verified by the researcher are shown. Select a marker to open its profile."
      />
      <div className="container-page py-10">
        {languages.length === 0 ? (
          <EmptyState title="No mapped languages yet" text="A language appears here once it is published with verified coordinates." />
        ) : (
          <>
            <LanguageMapLoader languages={languages} />
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              {Object.entries(VITALITY).map(([key, v]) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: v.color }} />
                  {v.label}
                </li>
              ))}
            </ul>
            <h2 className="mb-3 mt-10 text-xl">Mapped languages</h2>
            <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {languages.map((l) => (
                <li key={l.id}>
                  <Link href={`/languages/${l.slug}`} className="link">
                    {l.name}
                  </Link>
                  {l.region && <span className="text-muted"> · {l.region}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
