import Link from "next/link";
import { must, PAGE_SIZE, range } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, FilterBar, PageHeader, Pagination, SearchFilter, SelectFilter } from "@/components/ui/common";
import { cleanSearch, firstParam, formatDateRange, labelize, pageParam, stripHtml, truncate, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/research", title: "Research", description: "Ongoing and completed research projects." });
}

type SP = { [key: string]: string | string[] | undefined };

export default async function ResearchPage({ searchParams }: { searchParams: SP }) {
  const db = createPublicClient();
  const q = cleanSearch(searchParams.q);
  const status = firstParam(searchParams.status);
  const category = firstParam(searchParams.category);
  const sort = firstParam(searchParams.sort) || "newest";
  const page = pageParam(searchParams.page);

  const categoryRows = await must<Row[]>(db.from("research_projects").select("category"), "Loading categories");
  const categories = Array.from(new Set(categoryRows.map((r) => r.category).filter(Boolean))).sort() as string[];

  let query = db.from("research_projects").select("*", { count: "exact" });
  if (q) query = query.or(`title.ilike.%${q}%,abstract.ilike.%${q}%,category.ilike.%${q}%`);
  if (["planned", "ongoing", "completed"].includes(status)) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  query =
    sort === "oldest"
      ? query.order("start_date", { ascending: true, nullsFirst: false })
      : sort === "title"
        ? query.order("title", { ascending: true })
        : query.order("start_date", { ascending: false, nullsFirst: false });

  const [from, to] = range(page);
  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(`Loading research: ${error.message}`);
  const projects = (data ?? []) as Row[];

  return (
    <>
      <PageHeader eyebrow="Research" title="Research and projects" intro="Ongoing and completed research, with objectives, methods and findings." />
      <div className="container-page py-10">
        <FilterBar action="/research">
          <SearchFilter value={q} placeholder="Title, abstract or category" />
          <SelectFilter
            name="status"
            label="Status"
            value={status}
            options={[
              { value: "planned", label: "Planned" },
              { value: "ongoing", label: "Ongoing" },
              { value: "completed", label: "Completed" },
            ]}
          />
          {categories.length > 0 && (
            <SelectFilter name="category" label="Category" value={category} options={categories.map((c) => ({ value: c, label: c }))} />
          )}
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

        {projects.length === 0 ? (
          <EmptyState title="No projects found" text="Try changing or clearing the filters." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((p) => (
              <article key={p.id} className="card p-5">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="badge-green">{labelize(p.status)}</span>
                  {p.category && <span className="badge">{p.category}</span>}
                </div>
                <h2 className="text-xl leading-snug">
                  <Link href={`/research/${p.slug}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-1 text-xs text-muted">{formatDateRange(p.start_date, p.end_date)}</p>
                <p className="mt-2 text-sm text-muted">{truncate(stripHtml(p.abstract), 200)}</p>
                <Link href={`/research/${p.slug}`} className="link mt-3 inline-block text-sm">
                  View project
                </Link>
              </article>
            ))}
          </div>
        )}
        <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/research" params={{ q, status, category, sort }} />
      </div>
    </>
  );
}
