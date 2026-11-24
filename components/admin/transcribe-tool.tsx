"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getRecordingPreviewUrl, saveTranscription } from "@/app/admin/management-actions";

export interface SegmentRow {
  start_seconds: number;
  end_seconds: number;
  speaker_label: string;
  orthographic: string;
  phonetic: string;
  translation: string;
  notes: string;
}

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

/**
 * Manual, time-aligned transcription. This tool does not transcribe automatically:
 * a person listens, marks start and end times, and types the transcription.
 */
export function TranscribeTool({ recordingId, initial }: { recordingId: string; initial: SegmentRow[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopAt = useRef<number | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [rows, setRows] = useState<SegmentRow[]>(initial);
  const [time, setTime] = useState(0);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRecordingPreviewUrl(recordingId).then((res) => {
      if (cancelled) return;
      if (res.url) setSrc(res.url);
      else setLoadError(res.error ?? "The recording could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, [recordingId]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = (i: number, patch: Partial<SegmentRow>) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  function addRow() {
    const last = rows[rows.length - 1];
    const start = Math.round((last ? last.end_seconds : time) * 10) / 10;
    setRows((prev) => [...prev, { start_seconds: start, end_seconds: Math.round((start + 2) * 10) / 10, speaker_label: last?.speaker_label ?? "", orthographic: "", phonetic: "", translation: "", notes: "" }]);
    setDirty(true);
  }

  function playSegment(r: SegmentRow) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = r.start_seconds;
    stopAt.current = r.end_seconds;
    a.play().catch(() => setNote({ ok: false, text: "The recording could not be played." }));
  }

  function save() {
    setNote(null);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].end_seconds < rows[i].start_seconds) {
        setNote({ ok: false, text: `Segment ${i + 1} ends before it starts.` });
        return;
      }
    }
    const payload = rows.map((r) => ({
      start_seconds: r.start_seconds,
      end_seconds: r.end_seconds,
      speaker_label: r.speaker_label.trim() || null,
      orthographic: r.orthographic.trim() || null,
      phonetic: r.phonetic.trim() || null,
      translation: r.translation.trim() || null,
      notes: r.notes.trim() || null,
    }));
    startTransition(async () => {
      const res = await saveTranscription(recordingId, JSON.stringify(payload));
      setNote({ ok: res.ok, text: res.ok ? (res.message ?? "Saved.") : res.error });
      if (res.ok) setDirty(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="card sticky top-2 z-10 p-4">
        {src ? (
          <audio
            ref={audioRef}
            src={src}
            controls
            className="w-full"
            onTimeUpdate={(e) => {
              const t = e.currentTarget.currentTime;
              setTime(t);
              if (stopAt.current !== null && t >= stopAt.current) {
                e.currentTarget.pause();
                stopAt.current = null;
              }
            }}
          />
        ) : loadError ? (
          <p className="text-sm text-danger">{loadError}</p>
        ) : (
          <p className="text-sm text-muted">Loading the recording...</p>
        )}
        <p className="mt-2 text-xs text-muted tabular-nums">Playhead: {fmt(time)} seconds</p>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted">No segments yet. Add the first one, then use the playhead buttons to set its times.</p>}

      <ol className="space-y-4">
        {rows.map((r, i) => (
          <li key={i} className="card p-4">
            <div className="mb-3 grid gap-3 sm:grid-cols-4">
              <div>
                <label htmlFor={`s-${i}-start`} className="label">
                  Start (s)
                </label>
                <input id={`s-${i}-start`} type="number" step="0.1" min={0} className="input" value={r.start_seconds} onChange={(e) => update(i, { start_seconds: Number(e.target.value) })} />
                <button type="button" className="btn btn-outline btn-sm mt-1" onClick={() => update(i, { start_seconds: Math.round(time * 10) / 10 })}>
                  Use playhead
                </button>
              </div>
              <div>
                <label htmlFor={`s-${i}-end`} className="label">
                  End (s)
                </label>
                <input id={`s-${i}-end`} type="number" step="0.1" min={0} className="input" value={r.end_seconds} onChange={(e) => update(i, { end_seconds: Number(e.target.value) })} />
                <button type="button" className="btn btn-outline btn-sm mt-1" onClick={() => update(i, { end_seconds: Math.round(time * 10) / 10 })}>
                  Use playhead
                </button>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`s-${i}-spk`} className="label">
                  Speaker label
                </label>
                <input id={`s-${i}-spk`} className="input" value={r.speaker_label} onChange={(e) => update(i, { speaker_label: e.target.value })} placeholder="S1" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`s-${i}-orth`} className="label">
                  Orthographic transcription
                </label>
                <textarea id={`s-${i}-orth`} rows={2} className="input font-ipa" value={r.orthographic} onChange={(e) => update(i, { orthographic: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`s-${i}-phon`} className="label">
                  Phonetic annotation
                </label>
                <textarea id={`s-${i}-phon`} rows={2} className="input font-ipa" value={r.phonetic} onChange={(e) => update(i, { phonetic: e.target.value })} placeholder="[...]" />
              </div>
              <div>
                <label htmlFor={`s-${i}-tr`} className="label">
                  Translation
                </label>
                <textarea id={`s-${i}-tr`} rows={2} className="input" value={r.translation} onChange={(e) => update(i, { translation: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`s-${i}-notes`} className="label">
                  Notes
                </label>
                <textarea id={`s-${i}-notes`} rows={2} className="input" value={r.notes} onChange={(e) => update(i, { notes: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => playSegment(r)} disabled={!src}>
                Play segment
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setRows((prev) => prev.filter((_, j) => j !== i));
                  setDirty(true);
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-outline" onClick={addRow}>
          <Plus size={14} /> Add segment
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Save transcription"}
        </button>
        {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
      {note && (
        <p role="status" className={`text-sm ${note.ok ? "text-success" : "text-danger"}`}>
          {note.text}
        </p>
      )}
    </div>
  );
}
