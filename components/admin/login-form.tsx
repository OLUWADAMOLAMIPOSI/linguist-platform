"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ denied = false }: { denied?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(denied ? "This account does not have access to the admin area." : "");
  const [busy, setBusy] = useState(false);

  // If a non-staff account landed here, end its session so it can sign in with the right account.
  useEffect(() => {
    if (denied) createClient().auth.signOut().catch(() => undefined);
  }, [denied]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError || !data.user) {
        setError(authError?.message === "Invalid login credentials" ? "The email or password is not correct." : (authError?.message ?? "Sign in failed."));
        return;
      }

      // Signing in is not enough: the account must also be listed as staff.
      const { data: staff, error: staffError } = await supabase.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
      if (staffError) {
        await supabase.auth.signOut();
        setError(`Could not check your access: ${staffError.message}`);
        return;
      }
      if (!staff) {
        await supabase.auth.signOut();
        setError("This account does not have access to the admin area.");
        return;
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input id="email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && (
        <p role="alert" className="rounded border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
