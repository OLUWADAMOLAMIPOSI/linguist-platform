import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { authorLine, formatCitation, type Author } from "@/lib/citations";
import { HtmlContent, PageHeader } from "@/components/ui/common";
import { CitationBlock } from "@/components/publications/citation-block";
import { PUBLICATION_TYPES } from "@/lib/linguistics";
import { formatDate, stripHtml, truncate, type Row } from "@/lib/utils";
import { siteUrl } from "@/lib/env";

async function load(slug: string) {
  const db = createPublicClient();
  const { data, error } = await db
    .from("publications")
    .select("*, publication_authors(given_names, family_name, sort_order), research_projects(title, slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Loading publication: ${error.message}`);
  return data as Row | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) return { title: "Publication not found" };
  return buildMetadata({
    path: `/publications/${p.slug}`,
    title: p.title,
    description: truncate(stripHtml(p.abstract), 160),
  });
}

export default async function PublicationPage({ params }: { params: { slug: string } }) {
  const pub = await load(params.slug);
  if (!pub) notFound();

  const authors: Author[] = ((pub.publication_authors ?? []) as Row[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({ given_names: a.given_names, family_name: a.family_name }));

  const citations = {
    apa: formatCitation(pub, authors, "apa"),
    mla: formatCitation(pub, authors, "mla"),
    chicago: formatCitation(pub, authors, "chicago"),
    bibtex: formatCitation(pub, authors, "bibtex"),
  };

  const doiUrl = pub.doi ? (/^https?:\/\//i.test(pub.doi) ? pub.doi : `https://doi.org/${pub.doi}`) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: pub.title,
    author: authors.map((a) => ({ "@type": "Person", name: `${a.given_names ?? ""} ${a.family_name}`.trim() })),
    datePublished: pub.publication_date ?? undefined,
    isPartOf: pub.venue ? { "@type": "Periodical", name: pub.venue } : undefined,
    url: `${siteUrl()}/publications/${pub.slug}`,
    sameAs: doiUrl ?? undefined,
    abstract: pub.abstract ? stripHtml(pub.abstract) : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader eyebrow={PUBLICATION_TYPES[pub.publication_type]} title={pub.title} intro={authorLine(authors) || undefined} />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-10">
          {pub.abstract && (
            <section>
              <h2 className="mb-3 text-2xl">Abstract</h2>
              <HtmlContent html={pub.abstract} />
            </section>
          )}
          <section>
            <h2 className="mb-3 text-2xl">Cite this work</h2>
            <CitationBlock citations={citations} />
          </section>
        </div>

        <aside className="space-y-6 text-sm">
          <dl className="space-y-2">
            {pub.publication_date && (
              <div>
                <dt className="text-muted">Published</dt>
                <dd>{formatDate(pub.publication_date)}</dd>
              </div>
            )}
            {pub.venue && (
              <div>
                <dt className="text-muted">Journal or publisher</dt>
                <dd>{pub.venue}</dd>
              </div>
            )}
            {(pub.volume || pub.issue) && (
              <div>
                <dt className="text-muted">Volume and issue</dt>
                <dd>{[pub.volume && `Volume ${pub.volume}`, pub.issue && `Issue ${pub.issue}`].filter(Boolean).join(", ")}</dd>
              </div>
            )}
            {pub.pages && (
              <div>
                <dt className="text-muted">Pages</dt>
                <dd>{pub.pages}</dd>
              </div>
            )}
            {pub.doi && (
              <div>
                <dt className="text-muted">DOI</dt>
                <dd>
                  <a href={doiUrl!} target="_blank" rel="noopener noreferrer" className="link break-all">
                    {pub.doi}
                  </a>
                </dd>
              </div>
            )}
            {pub.category && (
              <div>
                <dt className="text-muted">Category</dt>
                <dd>{pub.category}</dd>
              </div>
            )}
            {pub.research_projects && (
              <div>
                <dt className="text-muted">Research project</dt>
                <dd>
                  <Link href={`/research/${pub.research_projects.slug}`} className="link">
                    {pub.research_projects.title}
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          {(pub.keywords ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(pub.keywords as string[]).map((k) => (
                <span key={k} className="badge">
                  {k}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {pub.pdf_url && (
              <a href={pub.pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <FileText size={16} /> Download PDF
              </a>
            )}
            {pub.url && (
              <a href={pub.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <ExternalLink size={16} /> View at publisher
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
