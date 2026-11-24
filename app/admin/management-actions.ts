"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaff, type Staff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { getEmailConfig, sendBatch, sendEmail } from "@/lib/email";
import { cleanHtml } from "@/lib/sanitize";
import { escapeHtml } from "@/lib/utils";
import { siteUrl } from "@/lib/env";

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function requireAdmin(): Promise<{ staff: Staff } | { error: string }> {
  const staff = await getStaff();
  if (!staff) return { error: "Your session has expired. Please sign in again." };
  if (staff.role !== "admin") return { error: "Only administrators can do this." };
  return { staff };
}

// ---------------------------------------------------------------- users

const newUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(10, "Password must be at least 10 characters").max(72),
  role: z.enum(["admin", "editor"]),
});

export async function createStaffUser(formData: FormData): Promise<Result> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { ok: false, error: auth.error };

    const parsed = newUserSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    });
    if (error || !data.user) return { ok: false, error: error?.message ?? "Could not create the user." };

    const { error: insertError } = await admin
      .from("admin_users")
      .insert({ user_id: data.user.id, email: parsed.data.email, role: parsed.data.role });
    if (insertError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return { ok: false, error: insertError.message };
    }
    await logActivity(auth.staff, "create", "admin_users", data.user.id, `Added ${parsed.data.role}: ${parsed.data.email}`);
    revalidatePath("/admin/settings/users");
    return { ok: true, message: "User created. Share the password with them securely." };
  } catch (err) {
    console.error("[createStaffUser]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not create the user." };
  }
}

export async function changeStaffRole(userId: string, role: "admin" | "editor"): Promise<Result> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { ok: false, error: auth.error };
    if (userId === auth.staff.id) return { ok: false, error: "You cannot change your own role." };
    if (role !== "admin" && role !== "editor") return { ok: false, error: "Invalid role." };
    const admin = createAdminClient();
    const { error } = await admin.from("admin_users").update({ role }).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    await logActivity(auth.staff, "update", "admin_users", userId, `Changed role to ${role}`);
    revalidatePath("/admin/settings/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not change the role." };
  }
}

export async function removeStaffUser(userId: string): Promise<Result> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { ok: false, error: auth.error };
    if (userId === auth.staff.id) return { ok: false, error: "You cannot remove your own account." };
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: error.message };
    await logActivity(auth.staff, "delete", "admin_users", userId, "Removed a staff account");
    revalidatePath("/admin/settings/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not remove the user." };
  }
}

// ------------------------------------------------------------- messages

const statusSchema = z.enum(["new", "read", "replied", "closed"]);
const messageTables = { contact: "contact_messages", collaboration: "collaboration_requests" } as const;
type MessageType = keyof typeof messageTables;

export async function updateMessageStatus(type: MessageType, id: string, status: string, notes?: string): Promise<Result> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
    const table = messageTables[type];
    if (!table) return { ok: false, error: "Unknown message type." };
    const parsed = statusSchema.safeParse(status);
    if (!parsed.success) return { ok: false, error: "Invalid status." };

    const supabase = createClient();
    const patch: Record<string, unknown> = { status: parsed.data };
    if (notes !== undefined) patch.admin_notes = notes.slice(0, 5000);
    if (parsed.data === "replied") patch.replied_at = new Date().toISOString();
    const { data, error } = await supabase.from(table).update(patch).eq("id", id).select("id");
    if (error) return { ok: false, error: error.message };
    if (!data?.length) return { ok: false, error: "Message not found." };
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${type}/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the message." };
  }
}

export async function deleteMessage(type: MessageType, id: string): Promise<Result> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
    const table = messageTables[type];
    if (!table) return { ok: false, error: "Unknown message type." };
    const supabase = createClient();
    const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
    if (error) return { ok: false, error: error.message };
    if (!data?.length) return { ok: false, error: "Message not found." };
    await logActivity(staff, "delete", table, id, "Deleted a message");
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete the message." };
  }
}

export async function replyToMessage(type: MessageType, id: string, replyBody: string): Promise<Result> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
    const body = replyBody.trim();
    if (body.length < 2) return { ok: false, error: "Write a reply first." };
    if (body.length > 8000) return { ok: false, error: "The reply is too long." };
    const table = messageTables[type];
    if (!table) return { ok: false, error: "Unknown message type." };

    const supabase = createClient();
    const { data: msg, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!msg) return { ok: false, error: "Message not found." };

    const config = await getEmailConfig();
    const html = `<div style="font-family:Georgia,serif;color:#27332d;max-width:560px">
      <p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>
      <hr style="border:none;border-top:1px solid #dcd6c6">
      <p style="color:#66726b;font-size:12px">In reply to: ${escapeHtml(msg.subject)}</p></div>`;
    const sent = await sendEmail({ to: msg.email, subject: `Re: ${msg.subject}`, html, replyTo: config.replyTo });
    if (!sent.ok) return { ok: false, error: `The reply was not sent: ${sent.error}` };

    await supabase
      .from(table)
      .update({ status: "replied", replied_at: new Date().toISOString() })
      .eq("id", id);
    await logActivity(staff, "reply", table, id, `Replied to ${msg.email}`);
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${type}/${id}`);
    return { ok: true, message: "Reply sent." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the reply." };
  }
}

// ----------------------------------------------------------- newsletter

export async function sendNewsletterIssue(issueId: string): Promise<Result> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { ok: false, error: auth.error };

    const admin = createAdminClient();
    const { data: issue, error } = await admin.from("newsletter_issues").select("*").eq("id", issueId).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!issue) return { ok: false, error: "Issue not found." };
    if (issue.status === "sent") return { ok: false, error: "This issue has already been sent." };

    const { data: subs, error: subError } = await admin
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token")
      .eq("status", "confirmed");
    if (subError) return { ok: false, error: subError.message };
    if (!subs?.length) return { ok: false, error: "There are no confirmed subscribers yet." };

    const body = cleanHtml(issue.body);
    const messages = subs.map((s) => ({
      to: s.email as string,
      subject: issue.subject as string,
      html: `<div style="font-family:Georgia,serif;color:#27332d;max-width:600px;line-height:1.6">${body}
        <hr style="border:none;border-top:1px solid #dcd6c6;margin-top:32px">
        <p style="color:#66726b;font-size:12px"><a href="${siteUrl()}/newsletter/unsubscribe?token=${s.unsubscribe_token}">Unsubscribe</a></p></div>`,
    }));

    const result = await sendBatch(messages);
    if (result.error) {
      return { ok: false, error: `Sending stopped after ${result.sent} email(s): ${result.error}` };
    }
    const { error: updateError } = await admin
      .from("newsletter_issues")
      .update({ status: "sent", sent_at: new Date().toISOString(), recipients_count: result.sent })
      .eq("id", issueId);
    if (updateError) return { ok: false, error: `Sent, but the issue could not be marked as sent: ${updateError.message}` };

    await logActivity(auth.staff, "send", "newsletter_issues", issueId, `Sent "${issue.subject}" to ${result.sent} subscribers`);
    revalidatePath("/admin/newsletter-issues");
    return { ok: true, message: `Sent to ${result.sent} subscriber(s).` };
  } catch (err) {
    console.error("[sendNewsletterIssue]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the newsletter." };
  }
}

export async function sendTestNewsletter(issueId: string): Promise<Result> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
    const supabase = createClient();
    const { data: issue, error } = await supabase.from("newsletter_issues").select("*").eq("id", issueId).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!issue) return { ok: false, error: "Issue not found." };
    const sent = await sendEmail({
      to: staff.email,
      subject: `[Test] ${issue.subject}`,
      html: `<div style="font-family:Georgia,serif;color:#27332d;max-width:600px;line-height:1.6">${cleanHtml(issue.body)}</div>`,
    });
    if (!sent.ok) return { ok: false, error: sent.error ?? "Could not send the test email." };
    return { ok: true, message: `Test email sent to ${staff.email}.` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the test email." };
  }
}

export async function removeSubscriber(id: string): Promise<Result> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
    const supabase = createClient();
    const { data, error } = await supabase.from("newsletter_subscribers").delete().eq("id", id).select("id");
    if (error) return { ok: false, error: error.message };
    if (!data?.length) return { ok: false, error: "Subscriber not found." };
    revalidatePath("/admin/newsletter-subscribers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not remove the subscriber." };
  }
}

// ---------------------------------------------------------- transcription

const segmentSchema = z
  .object({
    start_seconds: z.number().min(0),
    end_seconds: z.number().min(0),
    speaker_label: z.string().max(60).nullable(),
    orthographic: z.string().max(2000).nullable(),
    phonetic: z.string().max(2000).nullable(),
    translation: z.string().max(2000).nullable(),
    notes: z.string().max(2000).nullable(),
  })
  .refine((s) => s.end_seconds >= s.start_seconds, "A segment ends before it starts.");

export async function saveTranscription(recordingId: string, segmentsJson: string): Promise<Result> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
    let raw: unknown;
    try {
      raw = JSON.parse(segmentsJson);
    } catch {
      return { ok: false, error: "The transcription data is invalid." };
    }
    const parsed = z.array(segmentSchema).max(2000).safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid segment." };

    const supabase = createClient();
    const del = await supabase.from("audio_transcriptions").delete().eq("recording_id", recordingId);
    if (del.error) return { ok: false, error: del.error.message };
    if (parsed.data.length > 0) {
      const rows = parsed.data
        .slice()
        .sort((a, b) => a.start_seconds - b.start_seconds)
        .map((s, i) => ({ ...s, recording_id: recordingId, sort_order: i }));
      const ins = await supabase.from("audio_transcriptions").insert(rows);
      if (ins.error) return { ok: false, error: ins.error.message };
    }
    await logActivity(staff, "update", "audio_transcriptions", recordingId, `Saved ${parsed.data.length} transcription segment(s)`);
    revalidatePath(`/audio/${recordingId}`);
    return { ok: true, message: "Transcription saved." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the transcription." };
  }
}

/** Short-lived URL so staff can preview a private recording in the admin area. */
export async function getRecordingPreviewUrl(recordingId: string): Promise<{ url: string | null; error?: string }> {
  const staff = await getStaff();
  if (!staff) return { url: null, error: "Your session has expired." };
  const supabase = createClient();
  const { data, error } = await supabase.from("audio_recordings").select("file_path").eq("id", recordingId).maybeSingle();
  if (error || !data) return { url: null, error: error?.message ?? "Recording not found." };
  const admin = createAdminClient();
  const signed = await admin.storage.from("linguistic-recordings").createSignedUrl(data.file_path, 3600);
  if (signed.error) return { url: null, error: signed.error.message };
  return { url: signed.data.signedUrl };
}

// ----------------------------------------------------------------- tools

export async function approveTestimonial(id: string, approved: boolean): Promise<Result> {
  try {
    const staff = await getStaff();
    if (!staff) return { ok: false, error: "Your session has expired. Please sign in again." };
    const supabase = createClient();
    const { data, error } = await supabase.from("testimonials").update({ is_approved: approved }).eq("id", id).select("id");
    if (error) return { ok: false, error: error.message };
    if (!data?.length) return { ok: false, error: "Testimonial not found." };
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the testimonial." };
  }
}
