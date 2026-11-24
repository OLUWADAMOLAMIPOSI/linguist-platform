import { type Row } from "@/lib/utils";

/** Renders text where runs of capitals (Leipzig grammatical labels) are shown in small caps. */
function GlossText({ text }: { text: string }) {
  const parts = text.split(/([A-Z0-9]{2,}(?:\.[A-Z0-9]+)*)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^[A-Z0-9]{2,}(?:\.[A-Z0-9]+)*$/.test(part) ? (
          <span key={i} className="gloss-sc">
            {part.toLowerCase()}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/**
 * Leipzig-style interlinear example: original line, segmentation line, gloss line, free translation.
 * Words are aligned in columns so each morpheme line stays directly above its gloss.
 */
export function Interlinear({ gloss }: { gloss: Row }) {
  const source = String(gloss.source_text ?? "").trim().split(/\s+/).filter(Boolean);
  const seg = String(gloss.segmentation ?? "").trim().split(/\s+/).filter(Boolean);
  const glo = String(gloss.gloss ?? "").trim().split(/\s+/).filter(Boolean);
  const columns = Math.max(source.length, seg.length, glo.length);

  return (
    <figure className="card p-4">
      <div className="gloss" role="group" aria-label="Interlinear gloss">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="gloss-word">
            <span className="italic">{source[i] ?? ""}</span>
            <span>{seg[i] ?? ""}</span>
            <span>
              <GlossText text={glo[i] ?? ""} />
            </span>
          </div>
        ))}
      </div>
      <figcaption className="text-sm">
        <p>&lsquo;{gloss.free_translation}&rsquo;</p>
        {gloss.notes && <p className="mt-2 text-muted">{gloss.notes}</p>}
        {gloss.reference && <p className="mt-1 text-xs text-muted">Source: {gloss.reference}</p>}
      </figcaption>
    </figure>
  );
}
