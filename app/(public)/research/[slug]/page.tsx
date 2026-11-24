import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { HtmlContent, PageHeader } from "@/components/ui/common";
import { PublicationCard } from "@/components/publications/publication-card";
import { formatDateRange, labelize, stripHtml, truncate, type Row } from "@/lib/utils";

async function load(slug: string) {
  const db = createPublicClient();
  const { data, error } = await db
    .from("research_projects")
    .select("*, research_collaborators(*), languages(name, slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Loading project: ${error.message}`);
  return data as Row | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) return { title: "Project not found" };
  return buildMetadata({
    path: `/research/${p.slug}`,
    title: p.title,
    description: truncate(stripHtml(p.abstract), 160),
    image: p.cover_image_url,
  });
}

function Block({ title, html }: { title: string; html?: string | null }) {
  if (!html) return null;
  return (
    <section>
      <h2 className="mb-3 text-2xl">{title}</h2>
      <HtmlContent html={html} />
    </section>
  );
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await load(params.slug);
  if (!project) notFound();

  const db = createPublicClient();
  const pubs = await must<Row[]>(
    db
      .from("publications")
      .select("*, publication_authors(given_names, family_name, sort_order)")
      .eq("project_id", project.id)
      .order("publication_date", { ascending: false }),
    "Loading related publications"
  );

  const collaborators = ((project.research_collaborators ?? []) as Row[]).sort((a, b) => a.sort_order - b.sort_order);
  const attachments = (project.attachments ?? []) as { name: string; url: string }[];
  const milestones = (project.milestones ?? []) as string[];

  return (
    <>
      <PageHeader eyebrow={`${labelize(project.status)} project`} title={project.title} />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-10">
          {project.cover_image_url && (
            <Image
              src={project.cover_image_url}
              alt={`Photograph for ${project.title}`}
              width={1200}
              height={675}
              className="aspect-video w-full rounded border border-line object-cover"
            />
          )}
          <Block title="Abstract" html={project.abstract} />
          <Block title="Research objectives" html={project.objectives} />
          <Block title="Research questions" html={project.research_questions} />
          <Block title="Methodology" html={project.methodology} />
          <Block title="Findings and conclusions" html={project.findings} />

          {milestones.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl">Project timeline</h2>
              <ol className="space-y-2 border-l-2 border-sand-dark pl-4 text-sm">
                {milestones.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ol>
            </section>
          )}

          {pubs.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl">Related publications</h2>
              <div className="space-y-4">
                {pubs.map((p) => (
                  <PublicationCard key={p.id} pub={p} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-8 text-sm">
          <div>
            <p className="eyebrow mb-2">Details</p>
            <dl className="space-y-2">
              {project.category && (
                <div>
                  <dt className="text-muted">Category</dt>
                  <dd>{project.category}</dd>
                </div>
              )}
              {(project.start_date || project.end_date) && (
                <div>
                  <dt className="text-muted">Period</dt>
                  <dd>{formatDateRange(project.start_date, project.end_date)}</dd>
                </div>
              )}
              {project.institution && (
                <div>
                  <dt className="text-muted">Institution</dt>
                  <dd>{project.institution}</dd>
                </div>
              )}
              {project.languages && (
                <div>
                  <dt className="text-muted">Language</dt>
                  <dd>
                    <Link href={`/languages/${project.languages.slug}`} className="link">
                      {project.languages.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {collaborators.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Collaborators</p>
              <ul className="space-y-2">
                {collaborators.map((c) => (
                  <li key={c.id}>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="link">
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                    {(c.role || c.affiliation) && (
                      <span className="block text-xs text-muted">{[c.role, c.affiliation].filter(Boolean).join(", ")}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Documents</p>
              <ul className="space-y-2">
                {attachments.map((a, i) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                      <Download size={14} /> {a.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
