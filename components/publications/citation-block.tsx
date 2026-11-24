"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface CitationSet {
  apa: string;
  mla: string;
  chicago: string;
  bibtex: string;
}

const STYLES: { key: keyof CitationSet; label: string }[] = [
  { key: "apa", label: "APA" },
  { key: "mla", label: "MLA" },
  { key: "chicago", label: "Chicago" },
  { key: "bibtex", label: "BibTeX" },
];

export function CitationBlock({ citations }: { citations: CitationSet }) {
  const [style, setStyle] = useState<keyof CitationSet>("apa");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copy() {
    setError("");
    try {
      await navigator.clipboard.writeText(citations[style]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copying is not available in this browser. Select the text and copy it manually.");
    }
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Citation style" className="flex gap-1">
          {STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={style === s.key}
              onClick={() => setStyle(s.key)}
              className={`btn btn-sm ${style === s.key ? "btn-primary" : "btn-outline"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="btn btn-outline btn-sm">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-ink">{citations[style]}</pre>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
