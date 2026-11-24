"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileText, Music, Trash2, Upload } from "lucide-react";
import { uploadFromBrowser } from "@/lib/admin/client-upload";
import { deleteMedia } from "@/app/admin/upload-actions";

export interface MediaItem {
  id: string;
  name: string;
  url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const ACCEPT = [
  "image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf",
  "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a",
];

function size(n: number | null): string {
  if (!n) return "";
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

export function MediaManager({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [pending, startTransition] = useTransition();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");
    setBusy(true);
    for (const f of files) {
      const res = await uploadFromBrowser(f, { bucket: "media-library", isPublic: true, accept: ACCEPT, maxMB: 25, record: true });
      if (!res.ok) {
        setError(`${f.name}: ${res.error}`);
        break;
      }
    }
    setBusy(false);
    router.refresh();
  }

  async function copy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Copy this address:", url);
    }
  }

  function remove(item: MediaItem) {
    if (!window.confirm(`Delete "${item.name}"? Pages that use it will lose the file.`)) return;
    startTransition(async () => {
      const res = await deleteMedia(item.id);
      if (!res.ok) setError(res.error ?? "Could not delete the file.");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={() => input.current?.click()} disabled={busy}>
          <Upload size={16} /> {busy ? "Uploading..." : "Upload files"}
        </button>
        <input ref={input} type="file" multiple accept={ACCEPT.join(",")} className="sr-only" onChange={onPick} tabIndex={-1} aria-hidden="true" />
        <p className="text-xs text-muted">Images, PDF and audio (MP3, WAV, OGG, M4A). Up to 25 MB each.</p>
      </div>
      {error && <p role="alert" className="mb-4 rounded border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-paper px-6 py-12 text-center text-sm text-muted">No files uploaded yet.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((m) => {
            const isImage = m.mime_type?.startsWith("image/") && m.url;
            const isAudio = m.mime_type?.startsWith("audio/");
            return (
              <li key={m.id} className="card overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-sand/40">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url!} alt="" className="h-full w-full object-cover" />
                  ) : isAudio ? (
                    <Music size={32} className="text-forest-light" />
                  ) : (
                    <FileText size={32} className="text-forest-light" />
                  )}
                </div>
                <div className="p-3 text-sm">
                  <p className="truncate font-medium" title={m.name}>
                    {m.name}
                  </p>
                  <p className="text-xs text-muted">{size(m.size_bytes)}</p>
                  {isAudio && m.url && <audio controls preload="none" src={m.url} className="mt-2 h-8 w-full" />}
                  <div className="mt-3 flex gap-2">
                    {m.url && (
                      <button type="button" className="btn btn-outline btn-sm flex-1" onClick={() => copy(m.url!, m.id)}>
                        <Copy size={12} /> {copied === m.id ? "Copied" : "Copy link"}
                      </button>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(m)} disabled={pending} aria-label={`Delete ${m.name}`}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
