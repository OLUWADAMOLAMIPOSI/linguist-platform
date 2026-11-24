import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EmailConfig {
  notifyEmail: string | null;
  fromEmail: string;
  replyTo: string | null;
}

export async function getEmailConfig(): Promise<EmailConfig> {
  let row: { notify_email?: string | null; from_email?: string | null; reply_to_email?: string | null } | null = null;
  try {
    const db = createAdminClient();
    const { data, error } = await db.from("email_settings").select("*").eq("id", 1).maybeSingle();
    if (error) console.error("[email] could not read email_settings:", error.message);
    row = data;
  } catch (err) {
    console.error("[email] settings unavailable:", err instanceof Error ? err.message : err);
  }
  return {
    notifyEmail: row?.notify_email || process.env.ADMIN_NOTIFY_EMAIL || null,
    fromEmail: row?.from_email || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    replyTo: row?.reply_to_email || null,
  };
}

interface SendInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | null;
}

export async function sendEmail(input: SendInput): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not configured." };
  const config = await getEmailConfig();
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: config.fromEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo ?? config.replyTo ?? undefined,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Send many emails (newsletter). Sent in batches of 100 through Resend's batch endpoint. */
export async function sendBatch(
  messages: { to: string; subject: string; html: string }[]
): Promise<{ sent: number; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: 0, error: "RESEND_API_KEY is not configured." };
  const config = await getEmailConfig();
  const resend = new Resend(key);
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({
      from: config.fromEmail,
      to: m.to,
      subject: m.subject,
      html: m.html,
    }));
    const { error } = await resend.batch.send(chunk);
    if (error) return { sent, error: error.message };
    sent += chunk.length;
  }
  return { sent };
}
