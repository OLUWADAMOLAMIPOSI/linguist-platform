import Link from "next/link";
import { must, PAGE_SIZE, range } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, FilterBar, PageHeader, Pagination, SearchFilter, SelectFilter } from "@/components/ui/common";
import { VITALITY } from "@/lib/linguistics";
import { cleanSearch, firstParam, pageParam, stripHtml, truncate, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/languages", title: "Language archive", description: "Documented languages, their structure and recordings." });
}

type SP = { [key: string]: string | string[] | undefined };

export default async function LanguagesPage({ searchParams }: { searchParams: SP }) {
  const db = createPublicClient();
  const q = cleanSearch(searchParams.q);
  const family = firstParam(searchParams.family);
  const vitality = firstParam(searchParams.vitality);
  const page = pageParam(searchParams.page);

  const families = await must<Row[]>(db.from("language_families").select("id, name").order("name"), "Loading families");

  let query = db.from("languages").select("*, language_families(name)", { count: "exact" }).order("name");
  if (q) query = query.or(`name.ilike.%${q}%,iso_code.ilike.%${q}%,region.ilike.%${q}%`);
  if (family) query = query.eq("family_id", family);
  if (VITALITY[vitality]) query = query.eq("vitality", vitality);

  const [from, to] = range(page);
  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(`Loading languages: ${error.message}`);
  const languages = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        eyebrow="Language documentation"
        title="Language archive"
        intro="Documented and described languages, with grammar, vocabulary, examples and recordings."
      />
      <div className="container-page py-10">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/languages/map" className="btn btn-outline">
            Open the language map
          </Link>
          <Link href="/dictionary" className="btn btn-outline">
            Search the dictionary
          </Link>
        </div>

        <FilterBar action="/languages">
          <SearchFilter value={q} placeholder="Name, ISO code or region" />
          {families.length > 0 && <SelectFilter name="family" label="Family" value={family} options={families.map((f) => ({ value: f.id, label: f.name }))} />}
          <SelectFilter
            name="vitality"
            label="Vitality"
            value={vitality}
            options={Object.entries(VITALITY).map(([value, v]) => ({ value, label: v.label }))}
          />
        </FilterBar>

        {languages.length === 0 ? (
          <EmptyState title="No languages found" text="Documented languages will appear here once they are published." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {languages.map((l) => (
              <article key={l.id} className="card p-5">
                <span className="badge" style={{ color: VITALITY[l.vitality]?.color }}>
                  {VITALITY[l.vitality]?.label}
                </span>
                <h2 className="mt-2 text-xl">
                  <Link href={`/languages/${l.slug}`} className="hover:underline">
                    {l.name}
                  </Link>
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {[l.iso_code && `ISO ${l.iso_code}`, l.language_families?.name, l.region].filter(Boolean).join(" · ")}
                </p>
                {l.description && <p className="mt-2 text-sm text-muted">{truncate(stripHtml(l.description), 130)}</p>}
              </article>
            ))}
          </div>
        )}
        <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/languages" params={{ q, family, vitality }} />
      </div>
    </>
  );
}
