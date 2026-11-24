import { Download } from "lucide-react";
import { getProfile, must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, HtmlContent, PageHeader } from "@/components/ui/common";
import { TestimonialForm } from "@/components/forms/public-forms";
import { TEACHING_KINDS } from "@/lib/linguistics";
import { formatDateRange, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/teaching", title: "Teaching and experience", description: "Courses, workshops, supervision and professional development." });
}

export default async function TeachingPage() {
  const db = createPublicClient();
  const [profile, courses, activities, testimonials] = await Promise.all([
    getProfile(),
    must<Row[]>(db.from("courses").select("*").order("sort_order"), "Loading courses"),
    must<Row[]>(db.from("teaching_experience").select("*").order("sort_order"), "Loading activities"),
    must<Row[]>(db.from("testimonials").select("*").order("created_at", { ascending: false }), "Loading testimonials"),
  ]);

  const grouped = Object.keys(TEACHING_KINDS)
    .map((kind) => ({ kind, label: TEACHING_KINDS[kind], rows: activities.filter((a) => a.kind === kind) }))
    .filter((g) => g.rows.length > 0);

  const empty = !profile?.teaching_philosophy && courses.length === 0 && grouped.length === 0;

  return (
    <>
      <PageHeader eyebrow="Teaching" title="Teaching and experience" />
      <div className="container-page space-y-14 py-12">
        {empty && <EmptyState title="Nothing added yet" text="Teaching information will appear here once it is added in the admin dashboard." />}

        {profile?.teaching_philosophy && (
          <section>
            <h2 className="mb-4 text-2xl">Teaching philosophy</h2>
            <HtmlContent html={profile.teaching_philosophy} />
          </section>
        )}

        {courses.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl">Courses taught</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((c) => (
                <article key={c.id} className="card p-5">
                  <div className="mb-1 flex flex-wrap gap-2">
                    {c.code && <span className="badge-green">{c.code}</span>}
                    {c.level && <span className="badge">{c.level}</span>}
                  </div>
                  <h3 className="text-lg">{c.title}</h3>
                  <p className="text-xs text-muted">{[c.institution, c.term].filter(Boolean).join(", ")}</p>
                  {c.description && <p className="mt-2 text-sm">{c.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {c.resources_url && (
                      <a href={c.resources_url} target="_blank" rel="noopener noreferrer" className="link">
                        Teaching resources
                      </a>
                    )}
                    {c.resource_file_url && (
                      <a href={c.resource_file_url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                        <Download size={14} /> Download
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {grouped.map((g) => (
          <section key={g.kind}>
            <h2 className="mb-4 text-2xl">{g.label}</h2>
            <ul className="space-y-4">
              {g.rows.map((r) => (
                <li key={r.id} className="border-l-2 border-sand-dark pl-4">
                  <p className="font-medium">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="link">
                        {r.title}
                      </a>
                    ) : (
                      r.title
                    )}
                  </p>
                  <p className="text-sm text-muted">{[r.organization, r.location].filter(Boolean).join(", ")}</p>
                  <p className="text-xs text-muted">{formatDateRange(r.start_date, r.end_date)}</p>
                  {r.description && <p className="mt-1 text-sm">{r.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="mb-4 text-2xl">Testimonials</h2>
          {testimonials.length > 0 && (
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {testimonials.map((t) => (
                <figure key={t.id} className="card p-5">
                  <blockquote className="text-sm leading-7">{t.content}</blockquote>
                  <figcaption className="mt-3 text-xs text-muted">
                    {t.author_name}
                    {(t.author_role || t.author_affiliation) && `, ${[t.author_role, t.author_affiliation].filter(Boolean).join(", ")}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          <div className="card max-w-2xl p-6">
            <h3 className="mb-1 text-lg">Share a testimonial</h3>
            <p className="mb-4 text-sm text-muted">Testimonials are reviewed before they appear on the website.</p>
            <TestimonialForm />
          </div>
        </section>
      </div>
    </>
  );
}
