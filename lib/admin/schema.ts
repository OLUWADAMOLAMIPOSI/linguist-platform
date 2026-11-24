import { z } from "zod";
import type { Field } from "@/lib/admin/resources";

/** Fields that are stored in other tables (or not at all) and so are not columns of the main row. */
export function isColumnField(f: Field): boolean {
  return f.type !== "children" && f.type !== "tags";
}

/** Reads one field from submitted form data and converts it to the type the database expects. */
export function readValue(field: Field, form: FormData): unknown {
  const raw = form.get(field.name);

  switch (field.type) {
    case "boolean":
      return raw === "on" || raw === "true";
    case "number": {
      const s = typeof raw === "string" ? raw.trim() : "";
      if (s === "") return null;
      return Number(s);
    }
    case "lines": {
      const s = typeof raw === "string" ? raw : "";
      return s
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    case "files": {
      const s = typeof raw === "string" && raw.trim() ? raw : "[]";
      try {
        return JSON.parse(s);
      } catch {
        return undefined;
      }
    }
    case "tree": {
      const s = typeof raw === "string" && raw.trim() ? raw : '{"nodes":[],"edges":[]}';
      try {
        return JSON.parse(s);
      } catch {
        return undefined;
      }
    }
    default: {
      const s = typeof raw === "string" ? raw.trim() : "";
      return s === "" ? null : s;
    }
  }
}

function schemaFor(f: Field): z.ZodTypeAny {
  switch (f.type) {
    case "boolean":
      return z.boolean();
    case "number":
      return z
        .number({ invalid_type_error: `${f.label} must be a number` })
        .refine((n) => Number.isFinite(n), `${f.label} must be a number`)
        .nullable();
    case "lines":
      return z.array(z.string().max(1000)).max(500);
    case "files":
      return z
        .array(z.object({ name: z.string().max(300), url: z.string().max(2000) }))
        .max(50, `${f.label}: too many files`);
    case "tree":
      return z.object({
        nodes: z
          .array(
            z.object({
              id: z.string(),
              label: z.string().max(200),
              x: z.number(),
              y: z.number(),
            })
          )
          .max(300),
        edges: z.array(z.object({ from: z.string(), to: z.string() })).max(600),
      });
    case "date":
      return z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, `${f.label} must be a valid date`)
        .nullable();
    case "datetime":
      return z.string().datetime({ message: `${f.label} must be a valid date and time` }).nullable();
    case "select": {
      const values = (f.options ?? []).map((o) => o.value);
      return z
        .string()
        .refine((v) => values.includes(v), `${f.label}: please choose one of the listed options`)
        .nullable();
    }
    case "url":
      return z
        .string()
        .max(2000)
        .url(`${f.label} must be a full URL starting with https://`)
        .refine((v) => /^https?:\/\//i.test(v), `${f.label} must start with http:// or https://`)
        .nullable();
    case "email":
      return z.string().email(`${f.label} must be a valid email address`).max(200).nullable();
    case "relation":
      return z.string().uuid(`${f.label}: invalid selection`).nullable();
    case "richtext":
    case "textarea":
      return z.string().max(300000).nullable();
    default:
      return z.string().max(2000, `${f.label} is too long`).nullable();
  }
}

export interface ValidationResult {
  values: Record<string, unknown>;
  errors: Record<string, string>;
}

/** Validates submitted form data against a list of field definitions. */
export function validateFields(fields: Field[], form: FormData): ValidationResult {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const f of fields.filter(isColumnField)) {
    const value = readValue(f, form);

    const empty = value === null || value === undefined || (Array.isArray(value) && value.length === 0);
    if (f.required && f.type !== "boolean" && empty) {
      errors[f.name] = `${f.label} is required`;
      continue;
    }
    if (value === undefined) {
      errors[f.name] = `${f.label} contains invalid data`;
      continue;
    }

    const parsed = schemaFor(f).safeParse(value);
    if (!parsed.success) {
      errors[f.name] = parsed.error.issues[0]?.message ?? `${f.label} is invalid`;
      continue;
    }
    values[f.name] = parsed.data;
  }

  return { values, errors };
}

/** Parses and validates the repeater rows of a "children" field. */
export function readChildren(
  field: Field,
  form: FormData
): { rows: Record<string, unknown>[]; error?: string } {
  const spec = field.child;
  if (!spec) return { rows: [] };
  const raw = form.get(field.name);
  let parsed: unknown = [];
  try {
    parsed = typeof raw === "string" && raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return { rows: [], error: `${field.label} contains invalid data` };
  }
  if (!Array.isArray(parsed)) return { rows: [], error: `${field.label} contains invalid data` };

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const src = (parsed[i] ?? {}) as Record<string, unknown>;
    const row: Record<string, unknown> = {};
    let hasContent = false;
    for (const sub of spec.fields) {
      const v = src[sub.name];
      const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
      if (s !== "") hasContent = true;
      if (sub.type === "number") {
        row[sub.name] = s === "" ? null : Number(s);
        if (s !== "" && !Number.isFinite(Number(s))) return { rows: [], error: `${field.label} row ${i + 1}: ${sub.label} must be a number` };
      } else if (sub.type === "url" && s !== "" && !/^https?:\/\//i.test(s)) {
        return { rows: [], error: `${field.label} row ${i + 1}: ${sub.label} must start with http:// or https://` };
      } else {
        row[sub.name] = s === "" ? null : s;
      }
    }
    if (!hasContent) continue; // ignore completely empty rows
    for (const sub of spec.fields) {
      if (sub.required && (row[sub.name] === null || row[sub.name] === "")) {
        return { rows: [], error: `${field.label} row ${i + 1}: ${sub.label} is required` };
      }
    }
    rows.push(row);
  }
  return { rows };
}
