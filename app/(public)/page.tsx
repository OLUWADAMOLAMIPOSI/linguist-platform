import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { getProfile, getSettings, must, socialLinks } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/env";
import { EmptyState, HtmlContent, SectionHeading } from "@/components/ui/common";
import { PublicationCard } from "@/components/publications/publication-card";
import { VITALITY } from "@/lib/linguistics";
import { truncate, stripHtml, type Row } from "@/lib/utils";

export async function generateMetadata() {
  const profile = await getProfile();
  return buildMetadata({
    path: "/",
    title: profile ? `${profile.full_name}${profile.academic_title ? ", " + profile.academic_title : ""}` : undefined,
    description: profile?.intro ?? profile?.headline,
    image: profile?.photo_url,
  });
}

export default async function HomePage() {
  const db = createPublicClient();
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);

  const [interests, affiliations, projects, publications, languages] = await Promise.all([
    must<Row[]>(db.from("research_interests").select("*").order("sort_order"), "Loading research interests"),
    must<Row[]>(db.from("academic_affiliations").select("*").order("sort_order"), "Loading affiliations"),
    must<Row[]>(
      db.from("research_projects").select("*").eq("is_featured", true).order("created_at", { ascending: false }).limit(3),
      "Loading projects"
    ),
    must<Row[]>(
      db
        .from("publications")
        .select("*, publication_authors(given_names, family_name, sort_order)")
        .order("publication_date", { ascending: false, nullsFirst: false })
        .limit(4),
      "Loading publications"
    ),
    must<Row[]>(db.from("languages").select("*").order("updated_at", { ascending: false }).limit(3), "Loading languages"),
  ]);

  const links = socialLinks(settings);

  if (!profile) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="This website is ready for its content"
          text="Sign in to the admin dashboard and complete the Profile section. The home page will fill in automatically."
          action={
            <Link href="/admin/login" className="btn btn-primary">
              Go to admin
            </Link>
          }
        />
      </div>
    );
  }

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name,
    jobTitle: profile.academic_title ?? undefined,
    description: profile.intro ?? undefined,
    image: profile.photo_url ?? undefined,
    url: siteUrl(),
    sameAs: links.map((l) => l.url),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <section className="border-b border-line bg-sand/40">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-[1fr_20rem] md:py-20">
          <div>
            {profile.academic_title && <p className="eyebrow mb-3">{profile.academic_title}</p>}
            <h1 className="text-4xl sm:text-5xl">{profile.full_name}</h1>
            {profile.specialization && <p className="mt-3 font-serif text-xl text-forest-light">{profile.specialization}</p>}
            {profile.headline && <p className="mt-4 max-w-xl text-lg text-muted">{profile.headline}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">
                Get in touch
              </Link>
              <Link href="/contact#collaborate" className="btn btn-outline">
                Propose a collaboration
              </Link>
              {profile.cv_url && (
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <Download size={16} /> Download CV
                </a>
              )}
            </div>
            {links.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {links.map((l) => (
                  <li key={l.label}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="link">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {profile.photo_url && (
            <div className="mx-auto w-56 md:w-full">
              <Image
                src={profile.photo_url}
                alt={`Portrait of ${profile.full_name}`}
                width={640}
                height={800}
                priority
                className="aspect-[4/5] w-full rounded border border-line object-cover shadow-soft"
              />
            </div>
          )}
        </div>
      </section>

      {(profile.intro || profile.biography) && (
        <section className="container-page py-14">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
            <div>
              <SectionHeading eyebrow="Introduction" title="About my work" />
              {profile.intro && <p className="max-w-3xl text-lg leading-8">{profile.intro}</p>}
              {profile.biography && (
                <p className="mt-4 max-w-3xl leading-8 text-muted">{truncate(stripHtml(profile.biography), 420)}</p>
              )}
              <Link href="/about" className="link mt-4 inline-block text-sm">
                Read the full biography
              </Link>
            </div>
            {interests.length > 0 && (
              <aside>
                <p className="eyebrow mb-3">Research interests</p>
                <ul className="space-y-2">
                  {interests.map((i) => (
                    <li key={i.id} className="border-l-2 border-sand-dark pl-3 text-sm">
                      {i.name}
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="container-page pb-14">
          <SectionHeading
            eyebrow="Research"
            title="Featured research projects"
            action={
              <Link href="/research" className="link text-sm">
                All projects
              </Link>
            }
          />
          <div className="grid gap-5 md:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="card p-5">
                <span className="badge-green">{p.status}</span>
                <h3 className="mt-3 text-lg leading-snug">
                  <Link href={`/research/${p.slug}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-muted">{truncate(stripHtml(p.abstract), 150)}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {publications.length > 0 && (
        <section className="border-y border-line bg-sand/30 py-14">
          <div className="container-page">
            <SectionHeading
              eyebrow="Publications"
              title="Recent publications"
              action={
                <Link href="/publications" className="link text-sm">
                  Full library
                </Link>
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              {publications.map((p) => (
                <PublicationCard key={p.id} pub={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {languages.length > 0 && (
        <section className="container-page py-14">
          <SectionHeading
            eyebrow="Language documentation"
            title="Featured documentation"
            action={
              <Link href="/languages" className="link text-sm">
                All languages
              </Link>
            }
          />
          <div className="grid gap-5 md:grid-cols-3">
            {languages.map((l) => (
              <article key={l.id} className="card p-5">
                <span className="badge" style={{ color: VITALITY[l.vitality]?.color }}>
                  {VITALITY[l.vitality]?.label}
                </span>
                <h3 className="mt-3 text-lg">
                  <Link href={`/languages/${l.slug}`} className="hover:underline">
                    {l.name}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-muted">{truncate(stripHtml(l.description), 130)}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {((profile.achievements ?? []).length > 0 || affiliations.length > 0) && (
        <section className="container-page pb-6">
          <div className="grid gap-10 md:grid-cols-2">
            {(profile.achievements ?? []).length > 0 && (
              <div>
                <p className="eyebrow mb-3">Academic achievements</p>
                <ul className="space-y-2 text-sm">
                  {(profile.achievements as string[]).map((a, i) => (
                    <li key={i} className="border-l-2 border-sand-dark pl-3">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {affiliations.length > 0 && (
              <div>
                <p className="eyebrow mb-3">Professional affiliations</p>
                <ul className="space-y-2 text-sm">
                  {affiliations.map((a) => (
                    <li key={a.id} className="border-l-2 border-sand-dark pl-3">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="link">
                          {a.name}
                        </a>
                      ) : (
                        a.name
                      )}
                      {a.role && <span className="text-muted">, {a.role}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="container-page py-14">
        <div className="card flex flex-col items-start justify-between gap-4 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl">Let us work together</h2>
            <p className="mt-1 text-muted">Research collaboration, speaking invitations or supervision enquiries are welcome.</p>
          </div>
          <Link href="/contact#collaborate" className="btn btn-primary">
            Start a conversation
          </Link>
        </div>
      </section>
    </>
  );
}
