"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  submitCollaboration,
  submitContact,
  submitTestimonial,
  subscribeNewsletter,
  type FormState,
} from "@/app/actions/public";
import { collaborationTypes, contactCategories } from "@/lib/validations/public";

const initial: FormState = { status: "idle" };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Sending..." : label}
    </button>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`rounded border px-3 py-2 text-sm ${
        ok ? "border-success/30 bg-success-soft text-success" : "border-danger/30 bg-danger-soft text-danger"
      }`}
    >
      {state.message}
    </p>
  );
}

function Field({
  label,
  name,
  state,
  children,
}: {
  label: string;
  name: string;
  state: FormState;
  children: React.ReactNode;
}) {
  const error = state.fieldErrors?.[name];
  return (
    <div>
      <label htmlFor={`pf-${name}`} className="label">
        {label}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

/** Hidden anti-spam inputs: a honeypot that real users never see, and a timestamp. */
function AntiSpam() {
  const [started, setStarted] = useState("");
  useEffect(() => setStarted(String(Date.now())), []);
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="pf-website">Leave this field empty</label>
        <input id="pf-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={started} />
    </>
  );
}

function useResetOnSuccess(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") ref.current?.reset();
  }, [state]);
  return ref;
}

export function ContactForm() {
  const [state, action] = useFormState(submitContact, initial);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="relative space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="full_name" state={state}>
          <input id="pf-full_name" name="full_name" className="input" autoComplete="name" required />
        </Field>
        <Field label="Email address" name="email" state={state}>
          <input id="pf-email" name="email" type="email" className="input" autoComplete="email" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject" name="subject" state={state}>
          <input id="pf-subject" name="subject" className="input" required />
        </Field>
        <Field label="Enquiry category" name="category" state={state}>
          <select id="pf-category" name="category" className="input" defaultValue="general">
            {contactCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Message" name="message" state={state}>
        <textarea id="pf-message" name="message" rows={6} className="input" required />
      </Field>
      <AntiSpam />
      <Feedback state={state} />
      <Submit label="Send message" />
    </form>
  );
}

export function CollaborationForm() {
  const [state, action] = useFormState(submitCollaboration, initial);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="relative space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="full_name" state={state}>
          <input id="pf-full_name" name="full_name" className="input" autoComplete="name" required />
        </Field>
        <Field label="Email address" name="email" state={state}>
          <input id="pf-email" name="email" type="email" className="input" autoComplete="email" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Institution or organization" name="affiliation" state={state}>
          <input id="pf-affiliation" name="affiliation" className="input" autoComplete="organization" />
        </Field>
        <Field label="Type of request" name="request_type" state={state}>
          <select id="pf-request_type" name="request_type" className="input" defaultValue="collaboration_proposal">
            {collaborationTypes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Subject" name="subject" state={state}>
        <input id="pf-subject" name="subject" className="input" required />
      </Field>
      <Field label="Describe your request" name="message" state={state}>
        <textarea id="pf-message" name="message" rows={7} className="input" required />
      </Field>
      <AntiSpam />
      <Feedback state={state} />
      <Submit label="Submit request" />
    </form>
  );
}

export function TestimonialForm() {
  const [state, action] = useFormState(submitTestimonial, initial);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="relative space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="author_name" state={state}>
          <input id="pf-author_name" name="author_name" className="input" required />
        </Field>
        <Field label="Your role" name="author_role" state={state}>
          <input id="pf-author_role" name="author_role" className="input" />
        </Field>
      </div>
      <Field label="Affiliation" name="author_affiliation" state={state}>
        <input id="pf-author_affiliation" name="author_affiliation" className="input" />
      </Field>
      <Field label="Your testimonial" name="content" state={state}>
        <textarea id="pf-content" name="content" rows={5} className="input" required />
      </Field>
      <AntiSpam />
      <Feedback state={state} />
      <Submit label="Submit testimonial" />
    </form>
  );
}

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useFormState(subscribeNewsletter, initial);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="relative space-y-2" noValidate>
      <div className={compact ? "flex gap-2" : "flex flex-col gap-2 sm:flex-row"}>
        <label htmlFor="pf-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="pf-newsletter-email"
          name="email"
          type="email"
          placeholder="Your email address"
          className="input"
          autoComplete="email"
          required
        />
        <Submit label="Subscribe" />
      </div>
      {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
      <AntiSpam />
      <Feedback state={state} />
    </form>
  );
}
