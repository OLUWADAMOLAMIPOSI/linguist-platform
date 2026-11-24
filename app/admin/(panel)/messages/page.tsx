import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Pagination } from "@/components/ui/common";
import { collaborationTypes } from "@/lib/validations/public";
import { cleanSearch, firstParam, formatDate, labelize, pageParam, type Row } from "@/lib/utils";

export const metadata = { title: "Messages" };
const SIZE = 15;

export default async function MessagesPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  await requireStaff();
  const supabase = createClient();

  const tab = firstParam(searchParams.tab) === "collaboration" ? "collaboration" : "contact";
  const status = firstParam(searchParams.status);
  const q = cleanSearch(searchParams.q);
  const page = pageParam(searchParams.page);
  const table = tab === "contact" ? "contact_messages" : "collaboration_requests";

  let query = supabase.from(table).select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (["new", "read", "replied", "closed"].includes(status)) query = query.eq("status", status);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,subject.ilike.%${q}%`);
  const from = (page - 1) * SIZE;
  const { data, count, error } = await query.range(from, from + SIZE - 1);
  if (error) throw new Error(`Loading messages: ${error.message}`);
  const rows = (data ?? []) as Row[];

  const typeLabel = (v: string) => collaborationTypes.find((t) => t.value === v)?.label ?? labelize(v);
  const tabHref = (t: string) => `/admin/messages?tab=${t}`;

  return (
    <div className="max-w-5xl">
      <p className="eyebrow mb-1">Inbox</p>
      <h1 className="mb-6 text-3xl">Contact and collaboration</h1>

      <div className="mb-5 flex gap-2" role="tablist">
        <Link href={tabHref("contact")} role="tab" aria-selected={tab === "contact"} className={`btn ${tab === "contact" ? "btn-primary" : "btn-outline"}`}>
          Contact messages
        </Link>
        <Link href={tabHref("collaboration")} role="tab" aria-selected={tab === "collaboration"} className={`btn ${tab === "collaboration" ? "btn-primary" : "btn-outline"}`}>
          Collaboration requests
        </Link>
      </div>

      <form action="/admin/messages" method="get" className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="tab" value={tab} />
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Name, email or subject" className="input max-w-xs" />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className="input !w-auto">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
        <button type="submit" className="btn btn-outline">
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-paper px-6 py-12 text-center text-sm text-muted">No messages found.</div>
      ) : (
        <ul className="divide-y divide-line rounded border border-line bg-paper">
          {rows.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/messages/${tab}/${m.id}`} className="block px-4 py-3 hover:bg-sand/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={m.status === "new" ? "font-semibold" : ""}>
                    {m.subject}
                    <span className="ml-2 font-normal text-muted">{m.full_name}</span>
                  </p>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {formatDate(m.created_at, { day: "numeric", month: "short", year: "numeric" })}
                    <span className={m.status === "new" ? "badge-green" : "badge"}>{labelize(m.status)}</span>
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {m.email}
                  {tab === "collaboration" ? ` · ${typeLabel(m.request_type)}` : ` · ${labelize(m.category)}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} total={count ?? 0} pageSize={SIZE} basePath="/admin/messages" params={{ tab, status, q }} />
    </div>
  );
}
