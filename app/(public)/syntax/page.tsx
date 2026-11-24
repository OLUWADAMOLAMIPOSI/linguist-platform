import Link from "next/link";
import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHeader } from "@/components/ui/common";
import { Interlinear } from "@/components/linguistic-labs/interlinear";
import { normalizeTree, TreeView } from "@/components/linguistic-labs/tree-view";
import { LEIPZIG_ABBREVIATIONS, MORPH_PROCESSES } from "@/lib/linguistics";
import type { Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/syntax", title: "Syntax and morphology lab", description: "Syntactic analysis, morphology and interlinear glossing." });
}

export default async function SyntaxPage() {
  const db = createPublicClient();
  const [syntax, morph, glosses] = await Promise.all([
    must<Row[]>(db.from("syntactic_examples").select("*, languages(name, slug), syntax_trees(*)").order("created_at", { ascending: false }), "Loading syntax"),
    must<Row[]>(db.from("morphological_examples").select("*, languages(name, slug)").order("created_at", { ascending: false }), "Loading morphology"),
    must<Row[]>(db.from("interlinear_glosses").select("*, languages(name, slug)").order("created_at", { ascending: false }), "Loading glosses"),
  ]);

  const empty = syntax.length + morph.length + glosses.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Linguistic labs"
        title="Syntax and morphology"
        intro="Phrase structure, constituency, morpheme segmentation and interlinear glossing following the Leipzig Glossing Rules."
      />
      <div className="container-page space-y-14 py-10">
        {empty && <EmptyState title="No examples published yet" text="Syntactic, morphological and interlinear examples appear here once they are published from the admin dashboard." />}

        {glosses.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl">Interlinear glossed examples</h2>
            <div className="space-y-5">
              {glosses.map((g) => (
                <div key={g.id}>
                  {g.languages && (
                    <Link href={`/languages/${g.languages.slug}`} className="eyebrow mb-1 inline-block hover:underline">
                      {g.languages.name}
                    </Link>
                  )}
                  <Interlinear gloss={g} />
                </div>
              ))}
            </div>
            <details className="mt-6 rounded border border-line bg-paper p-4 text-sm">
              <summary className="cursor-pointer font-medium text-forest-dark">Leipzig glossing abbreviations</summary>
              <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {LEIPZIG_ABBREVIATIONS.map(([abbr, meaning]) => (
                  <div key={abbr} className="flex gap-2">
                    <dt className="w-14 shrink-0 font-ipa">
                      <span className="gloss-sc">{abbr.toLowerCase()}</span>
                    </dt>
                    <dd className="text-muted">{meaning}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </section>
        )}

        {syntax.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl">Syntactic analysis</h2>
            <div className="space-y-6">
              {syntax.map((s) => (
                <article key={s.id} className="card p-5">
                  {s.languages && (
                    <Link href={`/languages/${s.languages.slug}`} className="eyebrow hover:underline">
                      {s.languages.name}
                    </Link>
                  )}
                  <p className="mt-1 font-ipa text-lg italic">{s.sentence}</p>
                  {s.translation && <p className="text-sm text-muted">&lsquo;{s.translation}&rsquo;</p>}
                  <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                    {s.phrase_structure && (
                      <div>
                        <dt className="eyebrow mb-1">Phrase structure</dt>
                        <dd className="whitespace-pre-wrap font-ipa">{s.phrase_structure}</dd>
                      </div>
                    )}
                    {s.constituency_analysis && (
                      <div>
                        <dt className="eyebrow mb-1">Constituency analysis</dt>
                        <dd className="whitespace-pre-wrap">{s.constituency_analysis}</dd>
                      </div>
                    )}
                    {s.grammatical_relations && (
                      <div>
                        <dt className="eyebrow mb-1">Grammatical relations</dt>
                        <dd className="whitespace-pre-wrap">{s.grammatical_relations}</dd>
                      </div>
                    )}
                    {s.word_order && (
                      <div>
                        <dt className="eyebrow mb-1">Word order</dt>
                        <dd>{s.word_order}</dd>
                      </div>
                    )}
                    {s.clause_structure && (
                      <div>
                        <dt className="eyebrow mb-1">Clause structure</dt>
                        <dd>{s.clause_structure}</dd>
                      </div>
                    )}
                    {s.transformation_notes && (
                      <div>
                        <dt className="eyebrow mb-1">Syntactic transformations</dt>
                        <dd className="whitespace-pre-wrap">{s.transformation_notes}</dd>
                      </div>
                    )}
                  </dl>
                  {s.syntax_trees && (
                    <div className="mt-4 border-t border-line pt-4">
                      <TreeView data={normalizeTree(s.syntax_trees.tree_data)} title={s.syntax_trees.title} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {morph.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl">Morphological analysis</h2>
            <div className="overflow-x-auto rounded border border-line bg-paper">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Language</th>
                    <th>Word</th>
                    <th>Segmentation</th>
                    <th>Root</th>
                    <th>Affixes</th>
                    <th>Process</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {morph.map((m) => (
                    <tr key={m.id}>
                      <td>{m.languages?.name}</td>
                      <td className="font-ipa">{m.word}</td>
                      <td className="font-ipa">{m.segmentation}</td>
                      <td className="font-ipa">{m.root}</td>
                      <td className="font-ipa">{m.affixes}</td>
                      <td>{MORPH_PROCESSES[m.process_type]}</td>
                      <td>
                        {m.translation}
                        {m.description && <span className="block text-xs text-muted">{m.description}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
