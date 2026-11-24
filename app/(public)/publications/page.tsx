import { must, PAGE_SIZE, range } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, FilterBar, PageHeader, Pagination, SearchFilter, SelectFilter } from "@/components/ui/common";
import { PublicationCard } from "@/components/publications/publication-card";
import { PUBLICATION_TYPES } from "@/lib/linguistics";
import { cleanSearch, firstParam, pageParam, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/publications", title: "Publications", description: "Academic publication library." });
}

type SP = { [key: string]: string | string[] | undefined };

export default async function PublicationsPage({ searchParams }: { searchParams: SP }) {
  const db = createPublicClient();
  const q = cleanSearch(searchParams.q);
  const type = firstParam(searchParams.type);
  const year = firstParam(searchParams.year);
  const sort = firstParam(searchParams.sort) || "newest";
  const page = pageParam(searchParams.page);

  const dates = await must<Row[]>(db.from("publications").select("publication_date"), "Loading years");
  const years = Array.from(
    new Set(dates.map((d) => (d.publication_date ? String(new Date(d.publication_date).getUTCFullYear()) : "")).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  let query = db.from("publications").select("*, publication_authors(given_names, family_name, sort_order)", { count: "exact" });
  if (q) query = query.or(`title.ilike.%${q}%,abstract.ilike.%${q}%,venue.ilike.%${q}%`);
  if (type && PUBLICATION_TYPES[type]) query = query.eq("publication_type", type);
  if (/^\d{4}$/.test(year)) query = query.gte("publication_date", `${year}-01-01`).lte("publication_date", `${year}-12-31`);
  query =
    sort === "oldest"
      ? query.order("publication_date", { ascending: true, nullsFirst: false })
      : sort === "title"
        ? query.order("title", { ascending: true })
        : query.order("publication_date", { ascending: false, nullsFirst: false });

  const [from, to] = range(page);
  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(`Loading publications: ${error.message}`);
  const pubs = (data ?? []) as Row[];

  return (
    <>
      <PageHeader eyebrow="Publications" title="Publication library" intro="Journal articles, conference papers, books, theses and reports." />
      <div className="container-page py-10">
        <FilterBar action="/publications">
          <SearchFilter value={q} placeholder="Title, abstract or journal" />
          <SelectFilter
            name="type"
            label="Type"
            value={type}
            options={Object.entries(PUBLICATION_TYPES).map(([value, label]) => ({ value, label }))}
          />
          {years.length > 0 && <SelectFilter name="year" label="Year" value={year} options={years.map((y) => ({ value: y, label: y }))} />}
          <div className="min-w-[10rem]">
            <label htmlFor="f-sort" className="label">
              Sort by
            </label>
            <select id="f-sort" name="sort" defaultValue={sort} className="input">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title (A to Z)</option>
            </select>
          </div>
        </FilterBar>

        {pubs.length === 0 ? (
          <EmptyState title="No publications found" text="Try changing or clearing the filters." />
        ) : (
          <div className="space-y-4">
            {pubs.map((p) => (
              <PublicationCard key={p.id} pub={p} />
            ))}
          </div>
        )}
        <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/publications" params={{ q, type, year, sort }} />
      </div>
    </>
  );
}
