import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { formatDate, type Row } from "@/lib/utils";

export const metadata = { title: "Overview" };

const STATS: { label: string; table: string; href: string }[] = [
  { label: "Publications", table: "publications", href: "/admin/publications" },
  { label: "Research projects", table: "research_projects", href: "/admin/research" },
  { label: "Documented languages", table: "languages", href: "/admin/languages" },
  { label: "Dictionary entries", table: "dictionary_entries", href: "/admin/dictionary" },
  { label: "Blog articles", table: "blog_posts", href: "/admin/blog" },
  { label: "Audio recordings", table: "audio_recordings", href: "/admin/audio-recordings" },
  { label: "Contact messages", table: "contact_messages", href: "/admin/messages" },
  { label: "Collaboration requests", table: "collaboration_requests", href: "/admin/messages?tab=collaboration" },
];

export default async function DashboardPage() {
  const staff = await requireStaff();
  const supabase = createClient();

  const counts = await Promise.all(
    STATS.map(async (s) => {
      const { count, error } = await supabase.from(s.table).select("id", { count: "exact", head: true });
      if (error) throw new Error(`Counting ${s.label.toLowerCase()}: ${error.message}`);
      return count ?? 0;
    })
  );

  const [{ data: activity, error: actError }, { count: profileCount }, { count: subs }] = await Promise.all([
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
  ]);
  if (actError) throw new Error(`Loading activity: ${actError.message}`);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">Overview</h1>
      <p className="mt-1 text-muted">Signed in as {staff.email}.</p>

      {(profileCount ?? 0) === 0 && (
        <div className="mt-6 rounded border border-sand-dark bg-sand/50 p-4 text-sm">
          <p className="font-medium text-forest-dark">Start here</p>
          <p className="mt-1 text-muted">
            Your website has no profile yet. <Link href="/admin/profile/new" className="link">Create your profile</Link>, then add your education,
            research and publications. Also open <Link href="/admin/website-settings" className="link">Website settings</Link> to set the site name and contact details.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Link key={s.table} href={s.href} className="card p-4 transition-colors hover:bg-sand/40">
            <p className="font-serif text-3xl text-forest-dark">{counts[i]}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{subs ?? 0} confirmed newsletter subscriber(s).</p>

      <h2 className="mb-3 mt-10 text-xl">Recent activity</h2>
      {!activity || activity.length === 0 ? (
        <p className="text-sm text-muted">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded border border-line bg-paper text-sm">
          {(activity as Row[]).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <span>
                <span className="badge mr-2 capitalize">{a.action}</span>
                {a.summary}
              </span>
              <span className="text-xs text-muted">
                {a.user_email} · {formatDate(a.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
