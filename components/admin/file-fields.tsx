"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { uploadFromBrowser } from "@/lib/admin/client-upload";
import type { FileSpec } from "@/lib/admin/resources";

function niceName(value: string): string {
  if (!value) return "";
  try {
    const last = decodeURIComponent(value.split("?")[0].split("/").pop() ?? value);
    return last;
  } catch {
    return value;
  }
}

const TYPE_HINT: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/svg+xml": "SVG",
  "application/pdf": "PDF",
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",
  "audio/x-wav": "WAV",
  "audio/ogg": "OGG",
  "audio/mp4": "M4A",
  "audio/x-m4a": "M4A",
  "audio/webm": "WebM",
  "audio/aac": "AAC",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "application/json": "JSON",
  "application/zip": "ZIP",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

function hint(spec: FileSpec): string {
  const types = Array.from(new Set(spec.accept.map((a) => TYPE_HINT[a] ?? a)));
  return `${types.join(", ")} · up to ${spec.maxMB} MB`;
}

/** Single file upload. The submitted value is the public URL, or the storage path for private buckets. */
export function FileField({ name, spec, initial, required }: { name: string; spec: FileSpec; initial: string; required?: boolean }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const isImage = spec.accept.every((a) => a.startsWith("image/")) && value.startsWith("http");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    const res = await uploadFromBrowser(file, { bucket: spec.bucket, isPublic: spec.isPublic, accept: spec.accept, maxMB: spec.maxMB });
    setBusy(false);
    if (!res.ok) setError(res.error);
    else setValue(res.value);
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded border border-line bg-paper p-3">
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-16 w-16 rounded border border-line object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{niceName(value)}</p>
            <p className="text-xs text-muted">{spec.isPublic ? "Uploaded (public)" : "Uploaded (stored privately)"}</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => input.current?.click()} disabled={busy}>
            Replace
          </button>
          {!required && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setValue("")} disabled={busy} aria-label="Remove file">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ) : (
        <button type="button" className="btn btn-outline" onClick={() => input.current?.click()} disabled={busy}>
          <Upload size={14} /> {busy ? "Uploading..." : "Choose file"}
        </button>
      )}
      {busy && value && <p className="help">Uploading...</p>}
      <input ref={input} type="file" accept={spec.accept.join(",")} className="sr-only" onChange={onPick} tabIndex={-1} aria-hidden="true" />
      <p className="help">{hint(spec)}</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export interface UploadedItem {
  name: string;
  url: string;
}

/** Multiple file uploads, stored as a list of {name, url}. */
export function FilesField({ name, spec, initial }: { name: string; spec: FileSpec; initial: UploadedItem[] }) {
  const [items, setItems] = useState<UploadedItem[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");
    setBusy(true);
    const added: UploadedItem[] = [];
    for (const f of files) {
      const res = await uploadFromBrowser(f, { bucket: spec.bucket, isPublic: spec.isPublic, accept: spec.accept, maxMB: spec.maxMB });
      if (!res.ok) {
        setError(`${f.name}: ${res.error}`);
        break;
      }
      added.push({ name: f.name, url: res.value });
    }
    setItems((prev) => [...prev, ...added]);
    setBusy(false);
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.length > 0 && (
        <ul className="mb-3 space-y-2">
          {items.map((it, i) => (
            <li key={`${it.url}-${i}`} className="flex items-center gap-3 rounded border border-line bg-paper px-3 py-2 text-sm">
              <input
                value={it.name}
                aria-label="Display name"
                onChange={(e) => setItems((prev) => prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)))}
                className="input !py-1"
              />
              <button type="button" className="btn btn-outline btn-sm" aria-label={`Remove ${it.name}`} onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn-outline" onClick={() => input.current?.click()} disabled={busy}>
        <Upload size={14} /> {busy ? "Uploading..." : "Add files"}
      </button>
      <input ref={input} type="file" multiple accept={spec.accept.join(",")} className="sr-only" onChange={onPick} tabIndex={-1} aria-hidden="true" />
      <p className="help">{hint(spec)}</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
