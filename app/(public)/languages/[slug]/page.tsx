import Link from "next/link";
import { notFound } from "next/navigation";
import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { HtmlContent, PageHeader } from "@/components/ui/common";
import { Interlinear } from "@/components/linguistic-labs/interlinear";
import { PHONOLOGY_CATEGORIES, MORPH_PROCESSES, VITALITY } from "@/lib/linguistics";
import { stripHtml, truncate, type Row } from "@/lib/utils";
import { normalizeTree, TreeView } from "@/components/linguistic-labs/tree-view";

async function load(slug: string) {
  const db = createPublicClient();
  const { data, error } = await db
    .from("languages")
    .select("*, language_families(name), language_dialects(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Loading language: ${error.message}`);
  return data as Row | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const l = await load(params.slug);
  if (!l) return { title: "Language not found" };
  return buildMetadata({ path: `/languages/${l.slug}`, title: l.name, description: truncate(stripHtml(l.description), 160) });
}

export default async function LanguagePage({ params }: { params: { slug: string } }) {
  const lang = await load(params.slug);
  if (!lang) notFound();
  const db = createPublicClient();
  const id = lang.id as string;

  const [phonology, phonExamples, syntax, morph, glosses, entries, recordings, projects] = await Promise.all([
    must<Row[]>(db.from("phonological_data").select("*").eq("language_id", id).order("sort_order"), "Loading phonology"),
    must<Row[]>(db.from("phonological_examples").select("*").eq("language_id", id).order("minimal_pair_group"), "Loading phonological examples"),
    must<Row[]>(db.from("syntactic_examples").select("*, syntax_trees(*)").eq("language_id", id), "Loading syntax"),
    must<Row[]>(db.from("morphological_examples").select("*").eq("language_id", id), "Loading morphology"),
    must<Row[]>(db.from("interlinear_glosses").select("*").eq("language_id", id), "Loading glosses"),
    must<Row[]>(db.from("dictionary_entries").select("id, headword, translation").eq("language_id", id).order("headword").limit(12), "Loading vocabulary"),
    must<Row[]>(db.from("audio_recordings").select("id, title").eq("language_id", id), "Loading recordings"),
    must<Row[]>(db.from("research_projects").select("id, title, slug").eq("language_id", id), "Loading projects"),
  ]);

  const dialects = ((lang.language_dialects ?? []) as Row[]).sort((a, b) => a.sort_order - b.sort_order);
  const vit = VITALITY[lang.vitality];

  const minimalPairs = phonExamples.reduce<Record<string, Row[]>>((acc, e) => {
    if (e.example_type === "minimal_pair" && e.minimal_pair_group) (acc[e.minimal_pair_group] ??= []).push(e);
    return acc;
  }, {});
  const otherExamples = phonExamples.filter((e) => !(e.example_type === "minimal_pair" && e.minimal_pair_group));

  return (
    <>
      <PageHeader
        eyebrow={[lang.language_families?.name, lang.iso_code && `ISO 639-3: ${lang.iso_code}`].filter(Boolean).join(" · ") || "Language profile"}
        title={lang.name}
        intro={lang.alternative_names?.length ? `Also known as: ${lang.alternative_names.join(", ")}` : undefined}
      />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-12">
          {lang.description && (
            <section>
              <h2 className="mb-3 text-2xl">Overview</h2>
              <HtmlContent html={lang.description} />
            </section>
          )}

          {lang.grammar_overview && (
            <section>
              <h2 className="mb-3 text-2xl">Grammatical description</h2>
              <HtmlContent html={lang.grammar_overview} />
            </section>
          )}

          {phonology.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl">Phonological system</h2>
              <div className="space-y-6">
                {phonology.map((p) => (
                  <div key={p.id}>
                    <p className="eyebrow mb-1">{PHONOLOGY_CATEGORIES[p.category]}</p>
                    <h3 className="mb-2 text-lg">{p.title}</h3>
                    {(p.symbols ?? []).length > 0 && (
                      <p className="mb-2 flex flex-wrap gap-1.5">
                        {(p.symbols as string[]).map((s) => (
                          <span key={s} className="rounded border border-line bg-paper px-2 py-0.5 font-ipa text-lg">
                            {s}
                          </span>
                        ))}
                      </p>
                    )}
                    <HtmlContent html={p.content} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {(Object.keys(minimalPairs).length > 0 || otherExamples.length > 0) && (
            <section>
              <h2 className="mb-3 text-2xl">Phonological examples</h2>
              {Object.entries(minimalPairs).map(([group, rows]) => (
                <div key={group} className="mb-5">
                  <p className="eyebrow mb-2">Minimal pair: {group}</p>
                  <div className="overflow-x-auto">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Form</th>
                          <th>Phonemic</th>
                          <th>Phonetic</th>
                          <th>Meaning</th>
                          <th>Audio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id}>
                            <td className="font-ipa">{r.orthographic}</td>
                            <td className="font-ipa">{r.phonemic}</td>
                            <td className="font-ipa">{r.phonetic}</td>
                            <td>{r.translation}</td>
                            <td>{r.audio_url && <audio controls preload="none" src={r.audio_url} className="h-8 w-40" />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {otherExamples.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Form</th>
                        <th>Phonemic</th>
                        <th>Phonetic</th>
                        <th>Meaning</th>
                        <th>Audio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherExamples.map((r) => (
                        <tr key={r.id}>
                          <td className="font-ipa">{r.orthographic}</td>
                          <td className="font-ipa">{r.phonemic}</td>
                          <td className="font-ipa">{r.phonetic}</td>
                          <td>
                            {r.translation}
                            {r.notes && <span className="block text-xs text-muted">{r.notes}</span>}
                          </td>
                          <td>{r.audio_url && <audio controls preload="none" src={r.audio_url} className="h-8 w-40" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {morph.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl">Morphology</h2>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
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

          {(syntax.length > 0 || glosses.length > 0) && (
            <section>
              <h2 className="mb-3 text-2xl">Syntax and interlinear examples</h2>
              <div className="space-y-5">
                {glosses.map((g) => (
                  <Interlinear key={g.id} gloss={g} />
                ))}
                {syntax.map((s) => (
                  <div key={s.id} className="card p-4 text-sm">
                    <p className="font-ipa text-base italic">{s.sentence}</p>
                    {s.translation && <p>&lsquo;{s.translation}&rsquo;</p>}
                    {s.word_order && <p className="mt-1 text-muted">Word order: {s.word_order}</p>}
                    {s.syntax_trees?.is_published && <TreeView data={normalizeTree(s.syntax_trees.tree_data)} title={s.syntax_trees.title} />}
                  </div>
                ))}
              </div>
              <Link href="/syntax" className="link mt-3 inline-block text-sm">
                Explore the syntax and morphology lab
              </Link>
            </section>
          )}

          {dialects.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl">Dialects and varieties</h2>
              <ul className="space-y-3 text-sm">
                {dialects.map((d) => (
                  <li key={d.id} className="border-l-2 border-sand-dark pl-4">
                    <p className="font-medium">
                      {d.name}
                      {d.region && <span className="font-normal text-muted"> · {d.region}</span>}
                    </p>
                    {d.description && <p className="text-muted">{d.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lang.orthography_notes && (
            <section>
              <h2 className="mb-3 text-2xl">Orthography</h2>
              <HtmlContent html={lang.orthography_notes} />
            </section>
          )}
        </div>

        <aside className="space-y-7 text-sm">
          <dl className="space-y-2">
            <div>
              <dt className="text-muted">Vitality</dt>
              <dd style={{ color: vit?.color }} className="font-medium">
                {vit?.label}
                {lang.vitality_source && <span className="block text-xs font-normal text-muted">Source: {lang.vitality_source}</span>}
              </dd>
            </div>
            {lang.language_families?.name && (
              <div>
                <dt className="text-muted">Language family</dt>
                <dd>{lang.language_families.name}</dd>
              </div>
            )}
            {lang.classification && (
              <div>
                <dt className="text-muted">Classification</dt>
                <dd>{lang.classification}</dd>
              </div>
            )}
            {(lang.region || lang.country) && (
              <div>
                <dt className="text-muted">Geographical distribution</dt>
                <dd>{[lang.region, lang.country].filter(Boolean).join(", ")}</dd>
              </div>
            )}
            {lang.speakers_count != null && (
              <div>
                <dt className="text-muted">Speakers</dt>
                <dd>
                  {Number(lang.speakers_count).toLocaleString("en-GB")}
                  {lang.speakers_note && <span className="block text-xs text-muted">{lang.speakers_note}</span>}
                </dd>
              </div>
            )}
            {lang.glottocode && (
              <div>
                <dt className="text-muted">Glottocode</dt>
                <dd>{lang.glottocode}</dd>
              </div>
            )}
          </dl>

          {entries.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Sample vocabulary</p>
              <ul className="space-y-1">
                {entries.map((e) => (
                  <li key={e.id}>
                    <Link href={`/dictionary/${e.id}`} className="link font-ipa">
                      {e.headword}
                    </Link>
                    <span className="text-muted"> {e.translation}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/dictionary?language=${lang.id}`} className="link mt-2 inline-block">
                Browse all entries
              </Link>
            </div>
          )}

          {recordings.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Audio recordings</p>
              <ul className="space-y-1">
                {recordings.map((r) => (
                  <li key={r.id}>
                    <Link href={`/audio/${r.id}`} className="link">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Documentation projects</p>
              <ul className="space-y-1">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/research/${p.slug}`} className="link">
                      {p.title}
                    </Link>
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
