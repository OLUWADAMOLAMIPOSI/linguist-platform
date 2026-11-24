import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { authorLine } from "@/lib/citations";
import { PUBLICATION_TYPES } from "@/lib/linguistics";
import { formatYear, type Row } from "@/lib/utils";

export function PublicationCard({ pub }: { pub: Row }) {
  const authors = ((pub.publication_authors ?? []) as Row[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({ given_names: a.given_names, family_name: a.family_name }));
  return (
    <article className="card p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="badge-green">{PUBLICATION_TYPES[pub.publication_type] ?? pub.publication_type}</span>
        {pub.publication_date && <span className="text-xs text-muted">{formatYear(pub.publication_date)}</span>}
        {pub.category && <span className="badge">{pub.category}</span>}
      </div>
      <h3 className="text-lg leading-snug">
        <Link href={`/publications/${pub.slug}`} className="hover:underline">
          {pub.title}
        </Link>
      </h3>
      {authors.length > 0 && <p className="mt-1 text-sm text-muted">{authorLine(authors)}</p>}
      {pub.venue && <p className="mt-1 text-sm italic text-muted">{pub.venue}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <Link href={`/publications/${pub.slug}`} className="link">
          Details and citation
        </Link>
        {pub.pdf_url && (
          <a href={pub.pdf_url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
            <FileText size={14} /> PDF
          </a>
        )}
        {pub.url && (
          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
            <ExternalLink size={14} /> Publisher
          </a>
        )}
      </div>
    </article>
  );
}
