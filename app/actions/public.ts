"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { allowRequest } from "@/lib/rate-limit";
import { getEmailConfig, sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";
import { siteUrl } from "@/lib/env";
import {
  collaborationSchema,
  contactSchema,
  newsletterSchema,
  testimonialSchema,
  collaborationTypes,
} from "@/lib/validations/public";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function formObject(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") obj[key] = value;
  });
  if (typeof obj.startedAt === "string") obj.startedAt = Number(obj.startedAt);
  return obj;
}

function spamCheck(data: { website?: string; startedAt?: number }): string | null {
  if (data.website) return "Submission rejected.";
  if (data.startedAt && Date.now() - data.startedAt < 2500) return "That was a little too fast. Please try again.";
  return null;
}

function zodErrors(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "form");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

async function notifyAdmin(subject: string, rows: [string, string][], replyTo: string) {
  try {
    const config = await getEmailConfig();
    if (!config.notifyEmail) return;
    const html = `<div style="font-family:Georgia,serif;color:#27332d;max-width:560px">
      <h2 style="color:#243a2f">${escapeHtml(subject)}</h2>
      ${rows
        .map(
          ([k, v]) =>
            `<p><strong>${escapeHtml(k)}</strong><br>${escapeHtml(v).replace(/\n/g, "<br>")}</p>`
        )
        .join("")}
      <p style="color:#66726b;font-size:12px">Manage this in your admin dashboard.</p></div>`;
    const res = await sendEmail({ to: config.notifyEmail, subject, html, replyTo });
    if (!res.ok) console.error("[notify] email not sent:", res.error);
  } catch (err) {
    console.error("[notify] failed:", err instanceof Error ? err.message : err);
  }
}

const GENERIC_ERROR = "Something went wrong on our side. Please try again in a moment.";

export async function submitContact(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const parsed = contactSchema.safeParse(formObject(form));
    if (!parsed.success) {
      return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error.issues) };
    }
    const { website, startedAt, ...data } = parsed.data;
    const spam = spamCheck({ website, startedAt });
    if (spam) return { status: "error", message: spam };

    if (!(await allowRequest("contact", 5, 15))) {
      return { status: "error", message: "Too many submissions. Please wait a few minutes and try again." };
    }

    const db = createAdminClient();
    const { error } = await db.from("contact_messages").insert(data);
    if (error) {
      console.error("[contact] insert failed:", error.message);
      return { status: "error", message: GENERIC_ERROR };
    }

    await notifyAdmin(
      `New contact message: ${data.subject}`,
      [
        ["From", `${data.full_name} <${data.email}>`],
        ["Category", data.category],
        ["Message", data.message],
      ],
      data.email
    );
    return { status: "success", message: "Thank you. Your message has been sent." };
  } catch (err) {
    console.error("[contact]", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function submitCollaboration(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const parsed = collaborationSchema.safeParse(formObject(form));
    if (!parsed.success) {
      return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error.issues) };
    }
    const { website, startedAt, ...data } = parsed.data;
    const spam = spamCheck({ website, startedAt });
    if (spam) return { status: "error", message: spam };

    if (!(await allowRequest("collaboration", 4, 30))) {
      return { status: "error", message: "Too many submissions. Please wait a while and try again." };
    }

    const db = createAdminClient();
    const { error } = await db.from("collaboration_requests").insert({ ...data, affiliation: data.affiliation || null });
    if (error) {
      console.error("[collaboration] insert failed:", error.message);
      return { status: "error", message: GENERIC_ERROR };
    }

    const typeLabel = collaborationTypes.find((t) => t.value === data.request_type)?.label ?? data.request_type;
    await notifyAdmin(
      `New collaboration request: ${data.subject}`,
      [
        ["From", `${data.full_name} <${data.email}>`],
        ["Affiliation", data.affiliation || "Not given"],
        ["Type", typeLabel],
        ["Message", data.message],
      ],
      data.email
    );
    return { status: "success", message: "Thank you. Your request has been received and will be reviewed." };
  } catch (err) {
    console.error("[collaboration]", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function submitTestimonial(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const parsed = testimonialSchema.safeParse(formObject(form));
    if (!parsed.success) {
      return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error.issues) };
    }
    const { website, startedAt, ...data } = parsed.data;
    const spam = spamCheck({ website, startedAt });
    if (spam) return { status: "error", message: spam };

    if (!(await allowRequest("testimonial", 2, 60))) {
      return { status: "error", message: "Too many submissions. Please try again later." };
    }

    const db = createAdminClient();
    const { error } = await db.from("testimonials").insert({
      author_name: data.author_name,
      author_role: data.author_role || null,
      author_affiliation: data.author_affiliation || null,
      content: data.content,
      is_approved: false,
    });
    if (error) {
      console.error("[testimonial] insert failed:", error.message);
      return { status: "error", message: GENERIC_ERROR };
    }
    return { status: "success", message: "Thank you. Your testimonial will appear once it has been approved." };
  } catch (err) {
    console.error("[testimonial]", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function subscribeNewsletter(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const parsed = newsletterSchema.safeParse(formObject(form));
    if (!parsed.success) {
      return { status: "error", message: "Please enter a valid email address.", fieldErrors: zodErrors(parsed.error.issues) };
    }
    const { website, startedAt, email } = parsed.data;
    const spam = spamCheck({ website, startedAt });
    if (spam) return { status: "error", message: spam };

    if (!(await allowRequest("newsletter", 5, 30))) {
      return { status: "error", message: "Too many attempts. Please try again later." };
    }

    const db = createAdminClient();
    const address = email.toLowerCase();
    const { data: existing, error: lookupError } = await db
      .from("newsletter_subscribers")
      .select("id, status, confirm_token")
      .ilike("email", address)
      .maybeSingle();
    if (lookupError) {
      console.error("[newsletter] lookup failed:", lookupError.message);
      return { status: "error", message: GENERIC_ERROR };
    }

    // Same response whether or not the address is already known (does not reveal who subscribed).
    const okMessage = "Almost done. Please check your inbox and click the confirmation link.";

    if (existing?.status === "confirmed") {
      return { status: "success", message: "You are already subscribed. Thank you." };
    }

    let token: string;
    if (existing) {
      token = existing.confirm_token;
      if (existing.status === "unsubscribed") {
        const { error } = await db.from("newsletter_subscribers").update({ status: "pending" }).eq("id", existing.id);
        if (error) {
          console.error("[newsletter] reactivate failed:", error.message);
          return { status: "error", message: GENERIC_ERROR };
        }
      }
    } else {
      const { data, error } = await db
        .from("newsletter_subscribers")
        .insert({ email: address })
        .select("confirm_token")
        .single();
      if (error || !data) {
        console.error("[newsletter] insert failed:", error?.message);
        return { status: "error", message: GENERIC_ERROR };
      }
      token = data.confirm_token;
    }

    const link = `${siteUrl()}/newsletter/confirm?token=${token}`;
    const html = `<div style="font-family:Georgia,serif;color:#27332d;max-width:520px">
      <h2 style="color:#243a2f">Please confirm your subscription</h2>
      <p>Click the button below to confirm that you would like to receive research and publication updates.</p>
      <p><a href="${link}" style="background:#2f4a3c;color:#faf7f0;padding:10px 18px;text-decoration:none;border-radius:4px;display:inline-block">Confirm subscription</a></p>
      <p style="color:#66726b;font-size:12px">If you did not request this, you can ignore this email.</p></div>`;
    const sent = await sendEmail({ to: address, subject: "Please confirm your subscription", html });
    if (!sent.ok) {
      console.error("[newsletter] confirmation email failed:", sent.error);
      return {
        status: "error",
        message: "We could not send the confirmation email right now. Please try again later.",
      };
    }
    return { status: "success", message: okMessage };
  } catch (err) {
    console.error("[newsletter]", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}
