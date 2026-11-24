"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cleanSearch } from "@/lib/utils";

interface Entry {
  id: string;
  headword: string;
  native_form: string | null;
  translation: string;
  phonetic: string | null;
  part_of_speech: string | null;
  grammatical_category: string | null;
  languages: { name: string } | null;
}

const PAGE = 20;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NIL_UUID = /^[0-9a-f-]{36}$/i;

export function DictionarySearch({
  languages,
  initialLanguage,
}: {
  languages: { id: string; name: string }[];
  initialLanguage: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mode, setMode] = useState<"all" | "word" | "meaning">("all");
  const [language, setLanguage] = useState(NIL_UUID.test(initialLanguage) ? initialLanguage : "");
  const [category, setCategory] = useState("");
  const [letter, setLetter] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  // Debounce typing so every keystroke does not hit the database
  useEffect(() => {
    const t = setTimeout(() => setDebounced(cleanSearch(term)), 250);
    return () => clearTimeout(t);
  }, [term]);

  // Reset to the first page whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [debounced, mode, language, category, letter]);

  // Category options come from the published entries themselves
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase.from("dictionary_entries").select("part_of_speech, grammatical_category").limit(2000);
      if (cancelled || err || !data) return;
      const set = new Set<string>();
      data.forEach((r) => {
        if (r.part_of_speech) set.add(r.part_of_speech);
        if (r.grammatical_category) set.add(r.grammatical_category);
      });
      setCategories(Array.from(set).sort());
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    let query = supabase
      .from("dictionary_entries")
      .select("id, headword, native_form, translation, phonetic, part_of_speech, grammatical_category, languages(name)", { count: "exact" })
      .order("headword", { ascending: true });

    if (language) query = query.eq("language_id", language);
    if (debounced) {
      const p = `%${debounced}%`;
      if (mode === "word") query = query.or(`headword.ilike.${p},native_form.ilike.${p}`);
      else if (mode === "meaning") query = query.or(`translation.ilike.${p},definition.ilike.${p}`);
      else query = query.or(`headword.ilike.${p},native_form.ilike.${p},translation.ilike.${p},definition.ilike.${p}`);
    }
    if (category) {
      const c = cleanSearch(category);
      query = query.or(`part_of_speech.eq.${c},grammatical_category.eq.${c}`);
    }
    if (letter) query = query.ilike("headword", `${letter}%`);

    const from = (page - 1) * PAGE;
    query.range(from, from + PAGE - 1).then(({ data, count, error: err }) => {
      if (id !== requestId.current) return; // ignore out-of-date responses
      if (err) {
        setError(`The dictionary could not be searched: ${err.message}`);
        setEntries([]);
        setTotal(0);
      } else {
        setEntries((data ?? []) as unknown as Entry[]);
        setTotal(count ?? 0);
      }
      setLoading(false);
    });
  }, [supabase, debounced, mode, language, category, letter, page]);

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div>
      <div className="mb-6 space-y-4 rounded border border-line bg-paper p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <label htmlFor="d-term" className="label">
              Search
            </label>
            <input
              id="d-term"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Type a word or a meaning"
              className="input"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="d-mode" className="label">
              Search by
            </label>
            <select id="d-mode" className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="all">Word and meaning</option>
              <option value="word">Word only</option>
              <option value="meaning">Meaning only</option>
            </select>
          </div>
          <div>
            <label htmlFor="d-lang" className="label">
              Language
            </label>
            <select id="d-lang" className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="d-cat" className="label">
              Category
            </label>
            <select id="d-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div role="group" aria-label="Browse alphabetically" className="flex flex-wrap gap-1">
          <button type="button" onClick={() => setLetter("")} className={`btn btn-sm ${letter === "" ? "btn-primary" : "btn-outline"}`}>
            All
          </button>
          {LETTERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLetter(letter === l ? "" : l)}
              aria-pressed={letter === l}
              className={`btn btn-sm min-w-[2rem] ${letter === l ? "btn-primary" : "btn-outline"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-muted" role="status" aria-live="polite">
        {loading ? "Searching..." : `${total} ${total === 1 ? "entry" : "entries"} found`}
      </p>

      {error && <p className="field-error mb-4">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <div className="rounded border border-dashed border-line bg-paper px-6 py-10 text-center text-sm text-muted">
          No entries match your search. Only entries entered and verified by the researcher are listed.
        </div>
      )}

      {entries.length > 0 && (
        <ul className="divide-y divide-line rounded border border-line bg-paper">
          {entries.map((e) => (
            <li key={e.id}>
              <Link href={`/dictionary/${e.id}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 hover:bg-sand/40">
                <span className="font-ipa text-lg text-forest-dark">{e.headword}</span>
                {e.phonetic && <span className="font-ipa text-sm text-muted">{e.phonetic}</span>}
                <span className="text-sm">{e.translation}</span>
                <span className="ml-auto flex gap-2 text-xs text-muted">
                  {e.part_of_speech && <span className="badge">{e.part_of_speech}</span>}
                  {e.languages?.name && <span>{e.languages.name}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-muted">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
