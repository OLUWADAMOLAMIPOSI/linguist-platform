import Link from "next/link";
import type { ReactNode } from "react";
import { cleanHtml } from "@/lib/sanitize";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {intro && <p className="mt-2 text-muted">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="border-b border-line bg-sand/40">
      <div className="container-page py-12 sm:py-14">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-muted">{intro}</p>}
      </div>
    </header>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded border border-dashed border-line bg-paper px-6 py-12 text-center">
      <p className="font-serif text-lg text-forest-dark">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-2xl p-8">
        <p className="eyebrow mb-2">Setup required</p>
        <h1 className="text-2xl">Connect your Supabase project</h1>
        <p className="mt-3 text-muted">
          The application could not find its database settings. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code>, fill in your Supabase URL and keys, run the SQL files in{" "}
          <code>supabase/migrations</code>, then restart the development server. The README explains each step.
        </p>
      </div>
    </div>
  );
}

/** Renders rich text that was written in the admin editor. It is sanitised again on output. */
export function HtmlContent({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null;
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(html);
  if (!looksLikeHtml) {
    return (
      <div className={className ?? "prose-academic"}>
        {html.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    );
  }
  return <div className={className ?? "prose-academic"} dangerouslySetInnerHTML={{ __html: cleanHtml(html) }} />;
}

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const numbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) numbers.push(i);

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">
        Page {page} of {pages} ({total} results)
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className="btn btn-outline btn-sm">
            Previous
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm pointer-events-none opacity-50">Previous</span>
        )}
        {numbers.map((n) => (
          <Link
            key={n}
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={`btn btn-sm ${n === page ? "btn-primary" : "btn-outline"}`}
          >
            {n}
          </Link>
        ))}
        {page < pages ? (
          <Link href={href(page + 1)} className="btn btn-outline btn-sm">
            Next
          </Link>
        ) : (
          <span className="btn btn-outline btn-sm pointer-events-none opacity-50">Next</span>
        )}
      </div>
    </nav>
  );
}

export function FilterBar({
  action,
  children,
}: {
  action: string;
  children: ReactNode;
}) {
  return (
    <form action={action} method="get" className="mb-8 flex flex-wrap items-end gap-3 rounded border border-line bg-paper p-4">
      {children}
      <button type="submit" className="btn btn-primary">
        Apply
      </button>
      <Link href={action} className="btn btn-outline">
        Reset
      </Link>
    </form>
  );
}

export function SelectFilter({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-[10rem]">
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      <select id={`f-${name}`} name={name} defaultValue={value} className="input">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SearchFilter({ value, placeholder }: { value: string; placeholder: string }) {
  return (
    <div className="min-w-[14rem] flex-1">
      <label htmlFor="f-q" className="label">
        Search
      </label>
      <input id="f-q" name="q" type="search" defaultValue={value} placeholder={placeholder} className="input" />
    </div>
  );
}
