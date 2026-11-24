"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeStaffRole, createStaffUser, removeStaffUser } from "@/app/admin/management-actions";

export interface StaffRow {
  user_id: string;
  email: string;
  role: "admin" | "editor";
}

export function UserManager({ users, currentId }: { users: StaffRow[]; currentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await createStaffUser(data);
      setNote({ ok: res.ok, text: res.ok ? (res.message ?? "User created.") : res.error });
      if (res.ok) form.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto rounded border border-line bg-paper">
        <table className="table-base">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>
                  {u.email}
                  {u.user_id === currentId && <span className="badge ml-2">You</span>}
                </td>
                <td>
                  <label className="sr-only" htmlFor={`role-${u.user_id}`}>
                    Role for {u.email}
                  </label>
                  <select
                    id={`role-${u.user_id}`}
                    className="input !w-auto !py-1"
                    value={u.role}
                    disabled={u.user_id === currentId || pending}
                    onChange={(e) =>
                      startTransition(async () => {
                        const res = await changeStaffRole(u.user_id, e.target.value as "admin" | "editor");
                        setNote({ ok: res.ok, text: res.ok ? "Role updated." : res.error });
                        router.refresh();
                      })
                    }
                  >
                    <option value="admin">Administrator</option>
                    <option value="editor">Editor</option>
                  </select>
                </td>
                <td className="text-right">
                  {u.user_id !== currentId && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm text-danger"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(`Remove ${u.email}? They will lose access and their account will be deleted.`)) return;
                        startTransition(async () => {
                          const res = await removeStaffUser(u.user_id);
                          setNote({ ok: res.ok, text: res.ok ? "User removed." : res.error });
                          router.refresh();
                        });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={onCreate} className="card max-w-lg space-y-4 p-5">
        <h2 className="text-lg">Add a user</h2>
        <div>
          <label htmlFor="u-email" className="label">
            Email address
          </label>
          <input id="u-email" name="email" type="email" required className="input" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="u-pass" className="label">
            Temporary password
          </label>
          <input id="u-pass" name="password" type="password" required minLength={10} className="input" autoComplete="new-password" />
          <p className="help">At least 10 characters. Share it securely and ask the person to keep it private.</p>
        </div>
        <div>
          <label htmlFor="u-role" className="label">
            Role
          </label>
          <select id="u-role" name="role" className="input" defaultValue="editor">
            <option value="editor">Editor (manage content)</option>
            <option value="admin">Administrator (content, settings and users)</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Working..." : "Create user"}
        </button>
      </form>

      {note && (
        <p role="status" className={`text-sm ${note.ok ? "text-success" : "text-danger"}`}>
          {note.text}
        </p>
      )}
    </div>
  );
}
