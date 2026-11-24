"use client";

import { useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { CONSONANT_MANNERS, CONSONANT_PLACES, VOWEL_BACKNESS, VOWEL_HEIGHTS } from "@/lib/linguistics";

export interface IpaSymbol {
  id: string;
  symbol: string;
  name: string;
  category: string;
  place: string | null;
  manner: string | null;
  voicing: string | null;
  height: string | null;
  backness: string | null;
  rounded: boolean | null;
  description: string | null;
  audio_url: string | null;
}

export interface IpaExample {
  id: string;
  ipa_symbol_id: string | null;
  orthographic: string | null;
  phonemic: string | null;
  phonetic: string | null;
  translation: string | null;
  audio_url: string | null;
  language_name: string | null;
}

export function IpaChart({ symbols, examples }: { symbols: IpaSymbol[]; examples: IpaExample[] }) {
  const [selected, setSelected] = useState<IpaSymbol | null>(null);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const consonants = useMemo(() => symbols.filter((s) => s.category === "consonant"), [symbols]);
  const others = useMemo(() => symbols.filter((s) => s.category === "other_consonant"), [symbols]);
  const vowels = useMemo(() => symbols.filter((s) => s.category === "vowel"), [symbols]);

  const cell = (place: string, manner: string) =>
    consonants.filter((s) => s.place === place && s.manner === manner).sort((a, b) => (a.voicing === "voiceless" ? -1 : 1) - (b.voicing === "voiceless" ? -1 : 1));

  const vowelCell = (height: string, backness: string) =>
    vowels.filter((s) => s.height === height && s.backness === backness).sort((a, b) => Number(a.rounded) - Number(b.rounded));

  const usedPlaces = CONSONANT_PLACES.filter((p) => consonants.some((s) => s.place === p));
  const usedManners = CONSONANT_MANNERS.filter((m) => consonants.some((s) => s.manner === m));

  function play(url: string | null) {
    setAudioError("");
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    a.src = url;
    a.play().catch(() => setAudioError("The audio could not be played."));
  }

  const SymbolButton = ({ s }: { s: IpaSymbol }) => (
    <button
      type="button"
      onClick={() => setSelected(s)}
      aria-pressed={selected?.id === s.id}
      title={s.name}
      className={`h-9 min-w-[2rem] rounded px-1.5 font-ipa text-lg transition-colors ${
        selected?.id === s.id ? "bg-forest text-ivory" : "hover:bg-forest-soft"
      }`}
    >
      {s.symbol}
    </button>
  );

  const selectedExamples = selected ? examples.filter((e) => e.ipa_symbol_id === selected.id) : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-10">
        <section aria-labelledby="consonants-h">
          <h2 id="consonants-h" className="mb-3 text-xl">
            Consonants (pulmonic)
          </h2>
          <div className="overflow-x-auto rounded border border-line bg-paper">
            <table className="w-full min-w-[44rem] border-collapse text-center text-sm">
              <thead>
                <tr className="bg-sand/50">
                  <th className="border-b border-line px-2 py-2 text-left text-xs uppercase tracking-wide text-forest-dark">Manner</th>
                  {usedPlaces.map((p) => (
                    <th key={p} className="border-b border-l border-line px-1 py-2 text-xs font-medium capitalize text-forest-dark">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usedManners.map((m) => (
                  <tr key={m}>
                    <th scope="row" className="border-b border-line px-2 py-1 text-left text-xs font-medium capitalize text-forest-dark">
                      {m}
                    </th>
                    {usedPlaces.map((p) => (
                      <td key={p} className="border-b border-l border-line px-1 py-1">
                        <div className="flex justify-center gap-0.5">
                          {cell(p, m).map((s) => (
                            <SymbolButton key={s.id} s={s} />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="help">Where two symbols share a cell, the left one is voiceless and the right one is voiced.</p>
        </section>

        {others.length > 0 && (
          <section aria-labelledby="others-h">
            <h2 id="others-h" className="mb-3 text-xl">
              Other consonants
            </h2>
            <div className="flex flex-wrap gap-1 rounded border border-line bg-paper p-3">
              {others.map((s) => (
                <SymbolButton key={s.id} s={s} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="vowels-h">
          <h2 id="vowels-h" className="mb-3 text-xl">
            Vowels
          </h2>
          <div className="overflow-x-auto rounded border border-line bg-paper">
            <table className="w-full min-w-[28rem] border-collapse text-center text-sm">
              <thead>
                <tr className="bg-sand/50">
                  <th className="border-b border-line px-2 py-2 text-left text-xs uppercase tracking-wide text-forest-dark">Height</th>
                  {VOWEL_BACKNESS.map((b) => (
                    <th key={b} className="border-b border-l border-line px-1 py-2 text-xs font-medium capitalize text-forest-dark">
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VOWEL_HEIGHTS.map((h) => (
                  <tr key={h}>
                    <th scope="row" className="border-b border-line px-2 py-1 text-left text-xs font-medium capitalize text-forest-dark">
                      {h}
                    </th>
                    {VOWEL_BACKNESS.map((b) => (
                      <td key={b} className="border-b border-l border-line px-1 py-1">
                        <div className="flex justify-center gap-0.5">
                          {vowelCell(h, b).map((s) => (
                            <SymbolButton key={s.id} s={s} />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="help">Where two symbols share a cell, the left one is unrounded and the right one is rounded.</p>
        </section>
      </div>

      <aside aria-live="polite" className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          {!selected ? (
            <p className="text-sm text-muted">Select a symbol on the chart to see its description, articulation and audio examples.</p>
          ) : (
            <div className="space-y-3">
              <p className="font-ipa text-6xl leading-none text-forest-dark">{selected.symbol}</p>
              <p className="font-medium">{selected.name}</p>
              <dl className="space-y-1 text-sm">
                {selected.category !== "vowel" ? (
                  <>
                    {selected.place && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Place</dt>
                        <dd className="capitalize">{selected.place}</dd>
                      </div>
                    )}
                    {selected.manner && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Manner</dt>
                        <dd className="capitalize">{selected.manner}</dd>
                      </div>
                    )}
                    {selected.voicing && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Voicing</dt>
                        <dd className="capitalize">{selected.voicing}</dd>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Height</dt>
                      <dd className="capitalize">{selected.height}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Backness</dt>
                      <dd className="capitalize">{selected.backness}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Lip rounding</dt>
                      <dd>{selected.rounded ? "Rounded" : "Unrounded"}</dd>
                    </div>
                  </>
                )}
              </dl>
              {selected.description && <p className="text-sm text-muted">{selected.description}</p>}

              {selected.audio_url ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => play(selected.audio_url)}>
                  <Volume2 size={14} /> Play audio example
                </button>
              ) : (
                <p className="text-xs text-muted">No audio example has been added for this symbol yet.</p>
              )}
              {audioError && <p className="field-error">{audioError}</p>}

              {selectedExamples.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">Examples from documented languages</p>
                  <ul className="space-y-2 text-sm">
                    {selectedExamples.map((e) => (
                      <li key={e.id} className="flex items-start justify-between gap-2 border-l-2 border-sand-dark pl-3">
                        <div>
                          <span className="font-ipa">{e.orthographic}</span>
                          {e.phonetic && <span className="font-ipa text-muted"> {e.phonetic}</span>}
                          {e.translation && <span className="block text-xs text-muted">&lsquo;{e.translation}&rsquo;</span>}
                          {e.language_name && <span className="block text-xs text-muted">{e.language_name}</span>}
                        </div>
                        {e.audio_url && (
                          <button type="button" className="btn btn-outline btn-sm" aria-label={`Play ${e.orthographic ?? "example"}`} onClick={() => play(e.audio_url)}>
                            <Volume2 size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
