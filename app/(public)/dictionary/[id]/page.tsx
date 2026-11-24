import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/common";
import type { Row } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const db = createPublicClient();
  const { data, error } = await db
    .from("dictionary_entries")
    .select("*, languages(name, slug), dictionary_examples(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Loading entry: ${error.message}`);
  return data as Row | null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const e = await load(params.id);
  if (!e) return { title: "Entry not found" };
  return buildMetadata({
    path: `/dictionary/${e.id}`,
    title: `${e.headword} (${e.languages?.name ?? "dictionary"})`,
    description: `${e.headword}: ${e.translation}`,
  });
}

export default async function EntryPage({ params }: { params: { id: string } }) {
  const e = await load(params.id);
  if (!e) notFound();

  const db = createPublicClient();
  const related: string[] = e.related_words ?? [];
  let relatedEntries: Row[] = [];
  if (related.length > 0) {
    const { data, error } = await db
      .from("dictionary_entries")
      .select("id, headword, translation")
      .eq("language_id", e.language_id)
      .in("headword", related);
    if (error) throw new Error(`Loading related words: ${error.message}`);
    relatedEntries = data ?? [];
  }
  const examples = ((e.dictionary_examples ?? []) as Row[]).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <PageHeader eyebrow={e.languages?.name ?? "Dictionary"} title={e.headword} intro={e.translation} />
      <div className="container-page max-w-3xl space-y-8 py-12">
        <div className="card p-6">
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {e.native_form && (
              <div>
                <dt className="text-muted">Native-language form</dt>
                <dd className="font-ipa text-lg">{e.native_form}</dd>
              </div>
            )}
            {e.phonetic && (
              <div>
                <dt className="text-muted">Phonetic transcription</dt>
                <dd className="font-ipa text-lg">{e.phonetic}</dd>
              </div>
            )}
            {e.part_of_speech && (
              <div>
                <dt className="text-muted">Part of speech</dt>
                <dd>{e.part_of_speech}</dd>
              </div>
            )}
            {e.grammatical_category && (
              <div>
                <dt className="text-muted">Grammatical category</dt>
                <dd>{e.grammatical_category}</dd>
              </div>
            )}
            {e.dialect && (
              <div>
                <dt className="text-muted">Dialect</dt>
                <dd>{e.dialect}</dd>
              </div>
            )}
            {e.morphology && (
              <div>
                <dt className="text-muted">Morphology</dt>
                <dd className="font-ipa">{e.morphology}</dd>
              </div>
            )}
          </dl>
          {e.audio_url && (
            <div className="mt-5">
              <p className="mb-1 text-sm text-muted">Pronunciation</p>
              <audio controls preload="none" src={e.audio_url} className="w-full max-w-sm" />
            </div>
          )}
        </div>

        {e.definition && (
          <section>
            <h2 className="mb-2 text-xl">Definition</h2>
            <p className="leading-7">{e.definition}</p>
          </section>
        )}

        {examples.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl">Example sentences</h2>
            <ul className="space-y-3">
              {examples.map((x) => (
                <li key={x.id} className="border-l-2 border-sand-dark pl-4">
                  <p className="font-ipa italic">{x.sentence}</p>
                  {x.translation && <p className="text-sm text-muted">&lsquo;{x.translation}&rsquo;</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {e.usage_notes && (
          <section>
            <h2 className="mb-2 text-xl">Usage notes</h2>
            <p className="leading-7">{e.usage_notes}</p>
          </section>
        )}

        {related.length > 0 && (
          <section>
            <h2 className="mb-2 text-xl">Related words</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {related.map((w) => {
                const match = relatedEntries.find((r) => r.headword === w);
                return (
                  <li key={w}>
                    {match ? (
                      <Link href={`/dictionary/${match.id}`} className="badge-green font-ipa hover:underline">
                        {w}
                      </Link>
                    ) : (
                      <span className="badge font-ipa">{w}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="text-sm">
          <Link href="/dictionary" className="link">
            Back to the dictionary
          </Link>
          {e.languages && (
            <>
              {" · "}
              <Link href={`/languages/${e.languages.slug}`} className="link">
                {e.languages.name} profile
              </Link>
            </>
          )}
        </p>
      </div>
    </>
  );
}
