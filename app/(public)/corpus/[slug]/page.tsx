import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { HtmlContent, PageHeader } from "@/components/ui/common";
import { CorpusTools, type CorpusDoc } from "@/components/corpus/corpus-tools";
import { stripHtml, truncate, type Row } from "@/lib/utils";

async function load(slug: string) {
  const db = createPublicClient();
  const { data, error } = await db.from("corpus_collections").select("*, languages(name)").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Loading collection: ${error.message}`);
  return data as Row | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = await load(params.slug);
  if (!c) return { title: "Collection not found" };
  return buildMetadata({ path: `/corpus/${c.slug}`, title: c.title, description: truncate(stripHtml(c.description), 160) });
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await load(params.slug);
  if (!collection) notFound();

  const db = createPublicClient();
  // Row Level Security already limits this to documents marked public.
  const { data, error } = await db
    .from("corpus_documents")
    .select("id, title, content, source, corpus_annotations(id, start_offset, end_offset, label, note)")
    .eq("collection_id", collection.id)
    .order("title")
    .limit(300);
  if (error) throw new Error(`Loading documents: ${error.message}`);

  const docs: CorpusDoc[] = (data ?? []).map((d: Row) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    source: d.source,
    annotations: d.corpus_annotations ?? [],
  }));

  return (
    <>
      <PageHeader
        eyebrow={collection.languages?.name ?? "Corpus collection"}
        title={collection.title}
        intro={collection.license ? `Terms of use: ${collection.license}` : undefined}
      />
      <div className="container-page space-y-10 py-10">
        {collection.description && <HtmlContent html={collection.description} />}
        {collection.allow_download && collection.dataset_path && (
          <a href={`/corpus/${collection.slug}/download`} className="btn btn-primary">
            <Download size={16} /> Download dataset
          </a>
        )}
        <CorpusTools docs={docs} />
      </div>
    </>
  );
}
