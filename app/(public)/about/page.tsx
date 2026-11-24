import Image from "next/image";
import { Download } from "lucide-react";
import { getProfile, must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, HtmlContent, PageHeader } from "@/components/ui/common";
import { formatDateRange, type Row } from "@/lib/utils";

export async function generateMetadata() {
  const profile = await getProfile();
  return buildMetadata({ path: "/about", title: "About", description: profile?.intro, image: profile?.photo_url });
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl">{title}</h2>
      <ul className="space-y-1.5 text-sm">
        {items.map((it, i) => (
          <li key={i} className="border-l-2 border-sand-dark pl-3">
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AboutPage() {
  const db = createPublicClient();
  const profile = await getProfile();
  const [education, experiences, interests, affiliations] = await Promise.all([
    must<Row[]>(db.from("education").select("*").order("sort_order"), "Loading education"),
    must<Row[]>(db.from("experiences").select("*").order("sort_order"), "Loading experience"),
    must<Row[]>(db.from("research_interests").select("*").order("sort_order"), "Loading interests"),
    must<Row[]>(db.from("academic_affiliations").select("*").order("sort_order"), "Loading affiliations"),
  ]);

  if (!profile) {
    return (
      <>
        <PageHeader title="About" />
        <div className="container-page py-12">
          <EmptyState title="Profile not added yet" text="The biography will appear here once it is added in the admin dashboard." />
        </div>
      </>
    );
  }

  const academic = experiences.filter((e) => e.kind === "academic");
  const professional = experiences.filter((e) => e.kind === "professional");
  const memberships = affiliations.filter((a) => a.kind === "membership");
  const affils = affiliations.filter((a) => a.kind === "affiliation");

  const Timeline = ({ rows }: { rows: Row[] }) => (
    <ul className="space-y-4">
      {rows.map((e) => (
        <li key={e.id} className="border-l-2 border-sand-dark pl-4">
          <p className="font-medium">{e.role}</p>
          <p className="text-sm text-muted">
            {e.organization}
            {e.location ? `, ${e.location}` : ""}
          </p>
          <p className="text-xs text-muted">{formatDateRange(e.start_date, e.end_date)}</p>
          {e.description && <p className="mt-1 text-sm">{e.description}</p>}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader eyebrow={profile.academic_title ?? "About"} title={profile.full_name} intro={profile.specialization ?? undefined} />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-12">
          {profile.biography && (
            <section>
              <h2 className="mb-4 text-2xl">Biography</h2>
              <HtmlContent html={profile.biography} />
            </section>
          )}

          {education.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl">Education and qualifications</h2>
              <ul className="space-y-4">
                {education.map((e) => (
                  <li key={e.id} className="border-l-2 border-sand-dark pl-4">
                    <p className="font-medium">
                      {e.degree}
                      {e.field ? `, ${e.field}` : ""}
                    </p>
                    <p className="text-sm text-muted">{e.institution}</p>
                    <p className="text-xs text-muted">{[e.start_year, e.end_year].filter(Boolean).join(" – ")}</p>
                    {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {academic.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl">Academic experience</h2>
              <Timeline rows={academic} />
            </section>
          )}
          {professional.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl">Professional experience</h2>
              <Timeline rows={professional} />
            </section>
          )}

          {interests.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl">Research interests</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {interests.map((i) => (
                  <li key={i.id} className="card p-4">
                    <p className="font-medium">{i.name}</p>
                    {i.description && <p className="mt-1 text-sm text-muted">{i.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profile.teaching_philosophy && (
            <section>
              <h2 className="mb-4 text-2xl">Teaching philosophy</h2>
              <HtmlContent html={profile.teaching_philosophy} />
            </section>
          )}
        </div>

        <aside className="space-y-8">
          {profile.photo_url && (
            <Image
              src={profile.photo_url}
              alt={`Portrait of ${profile.full_name}`}
              width={480}
              height={600}
              className="aspect-[4/5] w-full rounded border border-line object-cover"
            />
          )}
          {profile.cv_url && (
            <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
              <Download size={16} /> Download academic CV
            </a>
          )}
          <ListSection title="Linguistic specializations" items={profile.specializations} />
          <ListSection title="Languages spoken or studied" items={profile.languages_spoken} />
          <ListSection title="Awards and recognitions" items={profile.awards} />
          {affils.length > 0 && <ListSection title="Academic affiliations" items={affils.map((a) => `${a.name}${a.role ? ", " + a.role : ""}`)} />}
          {memberships.length > 0 && (
            <ListSection title="Professional memberships" items={memberships.map((a) => `${a.name}${a.role ? ", " + a.role : ""}`)} />
          )}
        </aside>
      </div>
    </>
  );
}
