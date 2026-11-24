import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { getResource } from "@/lib/admin/resources";
import { ResourceForm } from "@/components/admin/resource-form";
import { DeleteButton, NewsletterActions } from "@/components/admin/action-buttons";
import type { Row } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResourceEditPage({ params }: { params: { resource: string; id: string } }) {
  const resource = getResource(params.resource);
  if (!resource) notFound();
  const staff = await requireStaff();
  if (resource.adminOnly && staff.role !== "admin") {
    return <p className="card max-w-lg p-6 text-sm">Only administrators can open this section.</p>;
  }

  const isNew = params.id === "new";
  if (!isNew && !UUID.test(params.id)) notFound();
  if (isNew && resource.noCreate) notFound();

  const supabase = createClient();

  let initial: Row = {};
  if (!isNew) {
    const { data, error } = await supabase.from(resource.table).select("*").eq("id", params.id).maybeSingle();
    if (error) throw new Error(`Loading record: ${error.message}`);
    if (!data) notFound();
    initial = data;
  }

  // Options for relation drop-downs
  const relationOptions: Record<string, { value: string; label: string }[]> = {};
  for (const f of resource.fields.filter((x) => x.type === "relation" && x.relation)) {
    const { table, labelField } = f.relation!;
    const { data, error } = await supabase.from(table).select(`id, ${labelField}`).order(labelField).limit(1000);
    if (error) throw new Error(`Loading ${f.label} options: ${error.message}`);
    relationOptions[f.name] = ((data ?? []) as unknown as Row[]).map((r) => ({ value: r.id, label: String(r[labelField]) }));
  }

  // Repeating groups (authors, collaborators, dialects, examples)
  const childRows: Record<string, Record<string, string>[]> = {};
  for (const f of resource.fields.filter((x) => x.type === "children" && x.child)) {
    if (isNew) {
      childRows[f.name] = [];
      continue;
    }
    const spec = f.child!;
    const { data, error } = await supabase.from(spec.table).select("*").eq(spec.fk, params.id).order("sort_order");
    if (error) throw new Error(`Loading ${f.label}: ${error.message}`);
    childRows[f.name] = ((data ?? []) as Row[]).map((r) =>
      Object.fromEntries(spec.fields.map((sf) => [sf.name, r[sf.name] == null ? "" : String(r[sf.name])]))
    );
  }

  // Tags
  const tagValues: Record<string, string> = {};
  for (const f of resource.fields.filter((x) => x.type === "tags" && x.tags)) {
    if (isNew) {
      tagValues[f.name] = "";
      continue;
    }
    const spec = f.tags!;
    const { data, error } = await supabase.from(spec.junction).select(`${spec.tagTable}(name)`).eq(spec.parentKey, params.id);
    if (error) throw new Error(`Loading tags: ${error.message}`);
    tagValues[f.name] = ((data ?? []) as unknown as Row[])
      .map((r) => (r[spec.tagTable] as { name: string } | null)?.name)
      .filter(Boolean)
      .join(", ");
  }

  const title = isNew ? `New: ${resource.label}` : resource.singleton ? resource.label : `Edit: ${String(initial[resource.titleField] ?? resource.label)}`;

  return (
    <div className="max-w-4xl">
      <nav className="mb-4 text-sm">
        {!resource.singleton && (
          <Link href={`/admin/${resource.key}`} className="link">
            Back to {resource.label.toLowerCase()}
          </Link>
        )}
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">{resource.group}</p>
          <h1 className="text-3xl">{title}</h1>
          {resource.description && <p className="mt-2 max-w-2xl text-sm text-muted">{resource.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && resource.key === "audio-recordings" && (
            <Link href={`/admin/transcribe/${params.id}`} className="btn btn-outline">
              Transcription tool
            </Link>
          )}
          {!isNew && !resource.singleton && (
            <DeleteButton resourceKey={resource.key} id={params.id} name={String(initial[resource.titleField] ?? "this record")} redirectTo={`/admin/${resource.key}`} small={false} />
          )}
        </div>
      </div>

      {!isNew && resource.key === "newsletter-issues" && <NewsletterActions id={params.id} sent={initial.status === "sent"} />}

      <div className="card p-6">
        <ResourceForm
          key={params.id}
          resource={resource}
          id={isNew ? null : params.id}
          initial={initial}
          relationOptions={relationOptions}
          childRows={childRows}
          tagValues={tagValues}
        />
      </div>
    </div>
  );
}
