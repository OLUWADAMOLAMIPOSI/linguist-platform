import Link from "next/link";
import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/common";
import { IpaChart, type IpaExample, type IpaSymbol } from "@/components/linguistic-labs/ipa-chart";
import { PHONOLOGY_CATEGORIES } from "@/lib/linguistics";
import type { Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/phonetics", title: "Phonetics and phonology lab", description: "Interactive IPA chart and phonological descriptions." });
}

export default async function PhoneticsPage() {
  const db = createPublicClient();
  const [symbols, examples, phonology] = await Promise.all([
    must<IpaSymbol[]>(db.from("ipa_symbols").select("*").order("sort_order"), "Loading IPA symbols"),
    must<Row[]>(db.from("phonological_examples").select("*, languages(name)").not("ipa_symbol_id", "is", null), "Loading examples"),
    must<Row[]>(db.from("phonological_data").select("*, languages(name, slug)").order("sort_order"), "Loading phonological data"),
  ]);

  const ipaExamples: IpaExample[] = examples.map((e) => ({
    id: e.id,
    ipa_symbol_id: e.ipa_symbol_id,
    orthographic: e.orthographic,
    phonemic: e.phonemic,
    phonetic: e.phonetic,
    translation: e.translation,
    audio_url: e.audio_url,
    language_name: e.languages?.name ?? null,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Linguistic labs"
        title="Phonetics and phonology"
        intro="Select any symbol on the interactive International Phonetic Alphabet chart to see how it is articulated and hear examples where recordings are available."
      />
      <div className="container-page space-y-14 py-10">
        <IpaChart symbols={symbols} examples={ipaExamples} />

        {phonology.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl">Phonological descriptions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {phonology.map((p) => (
                <article key={p.id} className="card p-5">
                  <p className="eyebrow mb-1">{PHONOLOGY_CATEGORIES[p.category]}</p>
                  <h3 className="text-lg">{p.title}</h3>
                  {p.languages && (
                    <Link href={`/languages/${p.languages.slug}`} className="link text-sm">
                      {p.languages.name}
                    </Link>
                  )}
                  {(p.symbols ?? []).length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-1">
                      {(p.symbols as string[]).map((s) => (
                        <span key={s} className="rounded border border-line px-1.5 font-ipa">
                          {s}
                        </span>
                      ))}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
