import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { getResource, type Field } from "@/lib/admin/resources";
import { Pagination } from "@/components/ui/common";
import { ApproveToggle, DeleteButton } from "@/components/admin/action-buttons";
import { cleanSearch, firstParam, formatDate, labelize, pageParam, type Row } from "@/lib/utils";

const SIZE = 15;

function formatCell(value: unknown, name: string, field: Field | undefined, labels: Record<string, string>): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span className="text-muted">-</span>;
  if (field?.type === "relation") return labels[String(value)] ?? <span className="text-muted">-</span>;
  if (typeof value === "boolean") return value ? <span className="badge-green">Yes</span> : <span className="badge">No</span>;
  if (field?.type === "select") return field.options?.find((o) => o.value === value)?.label ?? labelize(String(value));
  if (name.endsWith("_at") || field?.type === "date" || field?.type === "datetime") return formatDate(String(value), { year: "numeric", month: "short", day: "numeric" });
  if (Array.isArray(value)) return value.join(", ");
  if (name === "status" || name === "kind" || name === "category") return labelize(String(value));
  const s = String(value);
  return s.length > 70 ? s.slice(0, 69) + "…" : s;
}

const PUBLIC_PATH: Record<string, string> = {
  blog: "/blog",
  research: "/research",
  publications: "/publications",
  languages: "/languages",
  "corpus-collections": "/corpus",
};

export default async function ResourceListPage({
  params,
  searchParams,
}: {
  params: { resource: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const resource = getResource(params.resource);
  if (!resource) notFound();
  const staff = await requireStaff();
  if (resource.adminOnly && staff.role !== "admin") {
    return <p className="card max-w-lg p-6 text-sm">Only administrators can open this section.</p>;
  }

  const supabase = createClient();

  // Single-record sections (profile, settings) go straight to the editor
  if (resource.singleton) {
    const { data, error } = await supabase.from(resource.table).select("id").limit(1);
    if (error) throw new Error(`Loading ${resource.label}: ${error.message}`);
    if (data && data.length > 0) redirect(`/admin/${resource.key}/${data[0].id}`);
    if (!resource.noCreate) redirect(`/admin/${resource.key}/new`);
    return <p className="card max-w-lg p-6 text-sm">The settings row is missing. Run the database migrations to create it.</p>;
  }

  const q = cleanSearch(searchParams.q);
  const page = pageParam(searchParams.page);
  const saved = firstParam(searchParams.saved);

  let query = supabase.from(resource.table).select("*", { count: "exact" }).order(resource.orderBy[0], { ascending: resource.orderBy[1] });
  if (q && resource.searchFields.length > 0) {
    query = query.or(resource.searchFields.map((f) => `${f}.ilike.%${q}%`).join(","));
  }
  const from = (page - 1) * SIZE;
  const { data, count, error } = await query.range(from, from + SIZE - 1);
  if (error) throw new Error(`Loading ${resource.label}: ${error.message}`);
  const rows = (data ?? []) as Row[];

  // Look up readable names for relation columns
  const fieldByName = new Map(resource.fields.map((f) => [f.name, f]));
  const labels: Record<string, string> = {};
  for (const col of resource.columns) {
    const f = fieldByName.get(col);
    if (f?.type !== "relation" || !f.relation) continue;
    const ids = Array.from(new Set(rows.map((r) => r[col]).filter(Boolean)));
    if (ids.length === 0) continue;
    const { data: rel, error: relErr } = await supabase.from(f.relation.table).select(`id, ${f.relation.labelField}`).in("id", ids);
    if (relErr) throw new Error(`Loading ${f.label}: ${relErr.message}`);
    ((rel ?? []) as unknown as Row[]).forEach((r) => (labels[r.id] = String(r[f.relation!.labelField])));
  }

  const headerFor = (c: string) => fieldByName.get(c)?.label ?? labelize(c.replace(/_id$/, ""));

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">{resource.group}</p>
          <h1 className="text-3xl">{resource.label}</h1>
          {resource.description && <p className="mt-2 max-w-2xl text-sm text-muted">{resource.description}</p>}
        </div>
        {!resource.noCreate && (
          <Link href={`/admin/${resource.key}/new`} className="btn btn-primary">
            Add new
          </Link>
        )}
      </div>

      {saved && (
        <p role="status" className="mb-4 rounded border border-success/30 bg-success-soft px-4 py-2 text-sm text-success">
          Saved successfully.
        </p>
      )}

      <form action={`/admin/${resource.key}`} method="get" className="mb-4 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder={`Search ${resource.label.toLowerCase()}`} className="input max-w-sm" />
        <button type="submit" className="btn btn-outline">
          Search
        </button>
        {q && (
          <Link href={`/admin/${resource.key}`} className="btn btn-outline">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-paper px-6 py-12 text-center">
          <p className="font-serif text-lg text-forest-dark">{q ? "No results" : `No ${resource.label.toLowerCase()} yet`}</p>
          <p className="mt-1 text-sm text-muted">{q ? "Try a different search." : "Use the Add new button to create the first one."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-line bg-paper">
          <table className="table-base">
            <thead>
              <tr>
                {resource.columns.map((c) => (
                  <th key={c}>{headerFor(c)}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {resource.columns.map((c, i) => (
                    <td key={c}>
                      {i === 0 ? (
                        <Link href={`/admin/${resource.key}/${r.id}`} className="link font-medium">
                          {formatCell(r[c], c, fieldByName.get(c), labels)}
                        </Link>
                      ) : (
                        formatCell(r[c], c, fieldByName.get(c), labels)
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      {resource.key === "testimonials" && <ApproveToggle id={r.id} approved={Boolean(r.is_approved)} />}
                      {PUBLIC_PATH[resource.key] && r.slug && (
                        <Link href={`${PUBLIC_PATH[resource.key]}/${r.slug}`} target="_blank" className="btn btn-outline btn-sm">
                          View
                        </Link>
                      )}
                      <Link href={`/admin/${resource.key}/${r.id}`} className="btn btn-outline btn-sm">
                        Edit
                      </Link>
                      <DeleteButton resourceKey={resource.key} id={r.id} name={String(r[resource.titleField] ?? "this record")} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} total={count ?? 0} pageSize={SIZE} basePath={`/admin/${resource.key}`} params={{ q }} />
    </div>
  );
}
