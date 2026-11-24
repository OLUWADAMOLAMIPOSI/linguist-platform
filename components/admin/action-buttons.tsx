"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecord } from "@/app/admin/actions";
import { approveTestimonial, sendNewsletterIssue, sendTestNewsletter } from "@/app/admin/management-actions";

export function DeleteButton({
  resourceKey,
  id,
  name,
  redirectTo,
  small = true,
}: {
  resourceKey: string;
  id: string;
  name: string;
  redirectTo?: string;
  small?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onClick() {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteRecord(resourceKey, id);
      if (!res.ok) {
        setError(res.error);
        window.alert(res.error);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={onClick} disabled={pending} className={`btn btn-outline text-danger ${small ? "btn-sm" : ""}`}>
        {pending ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="sr-only" role="alert">{error}</span>}
    </>
  );
}

export function ApproveToggle({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await approveTestimonial(id, !approved);
          if (!res.ok) window.alert(res.error);
          router.refresh();
        })
      }
    >
      {approved ? "Unapprove" : "Approve"}
    </button>
  );
}

export function NewsletterActions({ id, sent }: { id: string; sent: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  if (sent) return <p className="text-sm text-muted">This issue has already been sent.</p>;

  return (
    <div className="mb-6 rounded border border-line bg-paper p-4">
      <p className="mb-3 text-sm text-muted">Save your changes first, then send a test to yourself before sending to all confirmed subscribers.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await sendTestNewsletter(id);
              setNote({ ok: res.ok, text: res.ok ? (res.message ?? "Sent.") : res.error });
            })
          }
        >
          Send test to me
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Send this issue to all confirmed subscribers? This cannot be undone.")) return;
            startTransition(async () => {
              const res = await sendNewsletterIssue(id);
              setNote({ ok: res.ok, text: res.ok ? (res.message ?? "Sent.") : res.error });
              router.refresh();
            });
          }}
        >
          {pending ? "Working..." : "Send to subscribers"}
        </button>
      </div>
      {note && (
        <p role="status" className={`mt-3 text-sm ${note.ok ? "text-success" : "text-danger"}`}>
          {note.text}
        </p>
      )}
    </div>
  );
}
