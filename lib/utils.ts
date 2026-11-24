export type Row = Record<string, any>;

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string | null | undefined, max = 160): string {
  const clean = (text ?? "").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

export function readingMinutes(html: string | null | undefined): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(value: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", opts ?? { year: "numeric", month: "long", day: "numeric" });
}

export function formatYear(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : String(d.getUTCFullYear());
}

export function formatDateRange(start?: string | null, end?: string | null): string {
  const s = start ? formatDate(start, { year: "numeric", month: "short" }) : "";
  const e = end ? formatDate(end, { year: "numeric", month: "short" }) : start ? "Present" : "";
  if (!s && !e) return "";
  return s && e ? `${s} – ${e}` : s || e;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function labelize(value: string | null | undefined): string {
  if (!value) return "";
  const s = value.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Remove characters that have a special meaning inside a PostgREST `or()` filter or ILIKE pattern. */
export function cleanSearch(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").replace(/[,()%*\\:"'`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function pageParam(value: string | string[] | undefined): number {
  const n = parseInt(firstParam(value), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
