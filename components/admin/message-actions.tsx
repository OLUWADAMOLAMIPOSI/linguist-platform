"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage, replyToMessage, updateMessageStatus } from "@/app/admin/management-actions";

export function MessageActions({
  type,
  id,
  status,
  notes,
  email,
}: {
  type: "contact" | "collaboration";
  id: string;
  status: string;
  notes: string;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [currentStatus, setStatus] = useState(status);
  const [adminNotes, setNotes] = useState(notes);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, okText: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      setNote({ ok: res.ok, text: res.ok ? (res.message ?? okText) : (res.error ?? "Something went wrong.") });
      if (res.ok) after?.();
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-3 text-lg">Status and notes</h2>
        <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
          <div>
            <label htmlFor="m-status" className="label">
              Status
            </label>
            <select id="m-status" className="input" value={currentStatus} onChange={(e) => setStatus(e.target.value)}>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="m-notes" className="label">
              Private notes
            </label>
            <textarea id="m-notes" rows={3} className="input" value={adminNotes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn btn-outline mt-3" disabled={pending} onClick={() => run(() => updateMessageStatus(type, id, currentStatus, adminNotes), "Saved.")}>
          Save status and notes
        </button>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg">Reply by email</h2>
        <p className="mb-3 text-sm text-muted">Sends an email to {email} and marks this message as replied.</p>
        <label htmlFor="m-reply" className="sr-only">
          Reply
        </label>
        <textarea id="m-reply" rows={6} className="input" value={reply} onChange={(e) => setReply(e.target.value)} />
        <button
          type="button"
          className="btn btn-primary mt-3"
          disabled={pending}
          onClick={() =>
            run(() => replyToMessage(type, id, reply), "Reply sent.", () => {
              setReply("");
              setStatus("replied");
            })
          }
        >
          {pending ? "Working..." : "Send reply"}
        </button>
      </section>

      {note && (
        <p role="status" className={`text-sm ${note.ok ? "text-success" : "text-danger"}`}>
          {note.text}
        </p>
      )}

      <button
        type="button"
        className="btn btn-outline text-danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this message permanently? Use this for spam.")) return;
          startTransition(async () => {
            const res = await deleteMessage(type, id);
            if (!res.ok) {
              setNote({ ok: false, text: res.error });
              return;
            }
            router.push(`/admin/messages?tab=${type}`);
            router.refresh();
          });
        }}
      >
        Delete message
      </button>
    </div>
  );
}
