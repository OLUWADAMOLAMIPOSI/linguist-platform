import Link from "next/link";
import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHeader } from "@/components/ui/common";
import { stripHtml, truncate, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/corpus", title: "Corpus and data analysis", description: "Annotated text collections and linguistic datasets." });
}

export default async function CorpusPage() {
  const db = createPublicClient();
  const collections = await must<Row[]>(
    db.from("corpus_collections").select("*, languages(name)").order("created_at", { ascending: false }),
    "Loading collections"
  );

  return (
    <>
      <PageHeader
        eyebrow="Linguistic labs"
        title="Corpus and linguistic data"
        intro="Text collections and annotated datasets. Only material cleared for public sharing is shown."
      />
      <div className="container-page py-10">
        {collections.length === 0 ? (
          <EmptyState title="No collections published yet" text="Published corpus collections appear here." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {collections.map((c) => (
              <article key={c.id} className="card p-5">
                {c.languages?.name && <span className="badge-green">{c.languages.name}</span>}
                <h2 className="mt-2 text-xl">
                  <Link href={`/corpus/${c.slug}`} className="hover:underline">
                    {c.title}
                  </Link>
                </h2>
                {c.description && <p className="mt-2 text-sm text-muted">{truncate(stripHtml(c.description), 160)}</p>}
                {c.license && <p className="mt-2 text-xs text-muted">Terms: {c.license}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
