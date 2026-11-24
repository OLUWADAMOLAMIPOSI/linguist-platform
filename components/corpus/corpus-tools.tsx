"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface CorpusDoc {
  id: string;
  title: string;
  content: string;
  source: string | null;
  annotations: { id: string; start_offset: number; end_offset: number; label: string; note: string | null }[];
}

const TOKEN = /[\p{L}\p{M}\p{N}'’-]+/gu;

function tokens(text: string): string[] {
  return (text.match(TOKEN) ?? []).map((t) => t.toLowerCase());
}

export function CorpusTools({ docs }: { docs: CorpusDoc[] }) {
  const [term, setTerm] = useState("");
  const [width, setWidth] = useState(40);
  const [topN, setTopN] = useState(15);

  const frequency = useMemo(() => {
    const counts = new Map<string, number>();
    let total = 0;
    for (const d of docs) {
      for (const t of tokens(d.content)) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
        total++;
      }
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { total, types: counts.size, sorted };
  }, [docs]);

  const concordance = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    const lines: { doc: string; left: string; hit: string; right: string }[] = [];
    for (const d of docs) {
      const hay = d.content.toLowerCase();
      let from = 0;
      while (lines.length < 200) {
        const idx = hay.indexOf(needle, from);
        if (idx === -1) break;
        lines.push({
          doc: d.title,
          left: d.content.slice(Math.max(0, idx - width), idx),
          hit: d.content.slice(idx, idx + needle.length),
          right: d.content.slice(idx + needle.length, idx + needle.length + width),
        });
        from = idx + Math.max(1, needle.length);
      }
      if (lines.length >= 200) break;
    }
    return lines;
  }, [docs, term, width]);

  const chartData = frequency.sorted.slice(0, topN).map(([word, count]) => ({ word, count }));

  const labelCounts = useMemo(() => {
    const m = new Map<string, number>();
    docs.forEach((d) => d.annotations.forEach((a) => m.set(a.label, (m.get(a.label) ?? 0) + 1)));
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [docs]);

  if (docs.length === 0) {
    return <p className="text-sm text-muted">No public documents are available in this collection yet.</p>;
  }

  return (
    <div className="space-y-12">
      <section aria-labelledby="conc-h">
        <h2 id="conc-h" className="mb-3 text-2xl">
          Concordance search
        </h2>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="c-term" className="label">
              Search word or phrase
            </label>
            <input id="c-term" type="search" value={term} onChange={(e) => setTerm(e.target.value)} className="input" placeholder="Type to find every occurrence" />
          </div>
          <div>
            <label htmlFor="c-width" className="label">
              Context (characters)
            </label>
            <select id="c-width" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="input">
              {[20, 40, 60, 80].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
        {term.trim() &&
          (concordance.length === 0 ? (
            <p className="text-sm text-muted">No occurrences found.</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted">
                {concordance.length}
                {concordance.length === 200 ? "+" : ""} occurrence(s)
              </p>
              <div className="overflow-x-auto rounded border border-line bg-paper">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {concordance.map((l, i) => (
                      <tr key={i} className="border-b border-line/70 last:border-0">
                        <td className="w-1/2 whitespace-pre py-1.5 pl-3 pr-1 text-right font-ipa">{l.left}</td>
                        <td className="whitespace-pre py-1.5 font-ipa font-bold text-forest">{l.hit}</td>
                        <td className="w-1/2 whitespace-pre py-1.5 pl-1 pr-3 font-ipa">{l.right}</td>
                        <td className="hidden whitespace-nowrap px-3 py-1.5 text-xs text-muted md:table-cell">{l.doc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ))}
      </section>

      <section aria-labelledby="freq-h">
        <h2 id="freq-h" className="mb-1 text-2xl">
          Word frequency
        </h2>
        <p className="mb-4 text-sm text-muted">
          {frequency.total.toLocaleString("en-GB")} tokens, {frequency.types.toLocaleString("en-GB")} distinct word forms (lower-cased).
        </p>
        <div className="mb-3 max-w-[10rem]">
          <label htmlFor="c-top" className="label">
            Show top
          </label>
          <select id="c-top" value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="input">
            {[10, 15, 25, 40].map((n) => (
              <option key={n} value={n}>
                {n} words
              </option>
            ))}
          </select>
        </div>
        <div className="card h-80 p-3" role="img" aria-label="Bar chart of the most frequent words">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid stroke="#e6e0d1" vertical={false} />
              <XAxis dataKey="word" interval={0} angle={-40} textAnchor="end" tick={{ fontSize: 11, fill: "#66726b" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#66726b" }} />
              <Tooltip cursor={{ fill: "#ece4d3" }} contentStyle={{ background: "#fffdf8", border: "1px solid #dcd6c6", fontSize: 12 }} />
              <Bar dataKey="count" fill="#4a6b58" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {labelCounts.length > 0 && (
        <section aria-labelledby="ann-h">
          <h2 id="ann-h" className="mb-3 text-2xl">
            Annotation distribution
          </h2>
          <div className="card h-72 p-3" role="img" aria-label="Bar chart of annotation labels">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labelCounts} margin={{ top: 8, right: 8, bottom: 20, left: 0 }}>
                <CartesianGrid stroke="#e6e0d1" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#66726b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#66726b" }} />
                <Tooltip cursor={{ fill: "#ece4d3" }} contentStyle={{ background: "#fffdf8", border: "1px solid #dcd6c6", fontSize: 12 }} />
                <Bar dataKey="count" fill="#2f4a3c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section aria-labelledby="docs-h">
        <h2 id="docs-h" className="mb-3 text-2xl">
          Annotated texts
        </h2>
        <div className="space-y-6">
          {docs.map((d) => (
            <article key={d.id} className="card p-5">
              <h3 className="text-lg">{d.title}</h3>
              {d.source && <p className="text-xs text-muted">Source: {d.source}</p>}
              <AnnotatedText doc={d} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AnnotatedText({ doc }: { doc: CorpusDoc }) {
  const anns = doc.annotations
    .filter((a) => a.start_offset < doc.content.length)
    .slice()
    .sort((a, b) => a.start_offset - b.start_offset);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  anns.forEach((a, i) => {
    if (a.start_offset < cursor) return; // skip overlapping annotations
    const end = Math.min(a.end_offset, doc.content.length);
    if (a.start_offset > cursor) parts.push(<span key={`t${i}`}>{doc.content.slice(cursor, a.start_offset)}</span>);
    parts.push(
      <mark key={`a${i}`} title={a.note ? `${a.label}: ${a.note}` : a.label} className="rounded-sm bg-forest-soft px-0.5 text-ink">
        {doc.content.slice(a.start_offset, end)}
        <sup className="ml-0.5 text-[0.65rem] font-semibold text-forest">{a.label}</sup>
      </mark>
    );
    cursor = end;
  });
  if (cursor < doc.content.length) parts.push(<span key="tail">{doc.content.slice(cursor)}</span>);

  return <p className="mt-3 whitespace-pre-wrap font-ipa leading-8">{parts}</p>;
}
