import { z } from "zod";

/** Honeypot ("website") must stay empty; "startedAt" lets the server reject instant bot submissions. */
const antiSpam = {
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().optional(),
};

export const contactCategories = [
  { value: "general", label: "General enquiry" },
  { value: "research", label: "Research" },
  { value: "teaching", label: "Teaching and supervision" },
  { value: "media", label: "Media and press" },
  { value: "other", label: "Other" },
] as const;

export const contactSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  subject: z.string().trim().min(3, "Please add a subject").max(200),
  category: z.enum(["general", "research", "teaching", "media", "other"]),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
  ...antiSpam,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const collaborationTypes = [
  { value: "collaboration_proposal", label: "Research collaboration proposal" },
  { value: "joint_publication", label: "Joint publication enquiry" },
  { value: "fieldwork", label: "Fieldwork collaboration" },
  { value: "academic_invitation", label: "Academic invitation" },
  { value: "speaking_request", label: "Conference speaking request" },
  { value: "supervision_enquiry", label: "Research supervision enquiry" },
] as const;

export const collaborationSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(200),
  affiliation: z.string().trim().max(200).optional().default(""),
  request_type: z.enum([
    "collaboration_proposal",
    "joint_publication",
    "fieldwork",
    "academic_invitation",
    "speaking_request",
    "supervision_enquiry",
  ]),
  subject: z.string().trim().min(3, "Please add a subject").max(200),
  message: z.string().trim().min(20, "Please describe your request in at least 20 characters").max(5000),
  ...antiSpam,
});
export type CollaborationInput = z.infer<typeof collaborationSchema>;

export const testimonialSchema = z.object({
  author_name: z.string().trim().min(2, "Please enter your name").max(120),
  author_role: z.string().trim().max(120).optional().default(""),
  author_affiliation: z.string().trim().max(200).optional().default(""),
  content: z.string().trim().min(20, "Please write at least 20 characters").max(1500),
  ...antiSpam,
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(200),
  ...antiSpam,
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;
