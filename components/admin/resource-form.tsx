"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveRecord } from "@/app/admin/actions";
import type { Field, Resource } from "@/lib/admin/resources";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FileField, FilesField, type UploadedItem } from "@/components/admin/file-fields";
import { ChildrenField } from "@/components/admin/children-field";
import { TreeBuilder } from "@/components/admin/tree-builder";
import { normalizeTree } from "@/components/linguistic-labs/tree-view";

type Row = Record<string, any>;

export interface ResourceFormProps {
  resource: Resource;
  id: string | null;
  initial: Row;
  relationOptions: Record<string, { value: string; label: string }[]>;
  childRows: Record<string, Record<string, string>[]>;
  tagValues: Record<string, string>;
}

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function DatetimeField({ name, initial, id }: { name: string; initial: string; id: string }) {
  const [local, setLocal] = useState("");
  // Convert on the client only, so the server and browser time zones never disagree during hydration
  useEffect(() => setLocal(toLocalInput(initial)), [initial]);
  let iso = "";
  if (local) {
    const d = new Date(local);
    if (!Number.isNaN(d.getTime())) iso = d.toISOString();
  }
  return (
    <>
      <input id={id} type="datetime-local" className="input" value={local} onChange={(e) => setLocal(e.target.value)} />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}

export function ResourceForm({ resource, id, initial, relationOptions, childRows, tagValues }: ResourceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);

  function valueOf(f: Field): any {
    const v = initial[f.name];
    return v === undefined || v === null ? (f.default ?? "") : v;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveRecord(resource.key, id, form);
      if (res.ok) {
        router.push(res.redirectTo ?? `/admin/${resource.key}`);
        router.refresh();
      } else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function renderInput(f: Field) {
    const inputId = `f-${f.name}`;
    const err = fieldErrors[f.name];
    const common = { id: inputId, name: f.name, "aria-invalid": err ? true : undefined } as const;

    switch (f.type) {
      case "textarea":
        return <textarea {...common} rows={f.rows ?? 4} className="input" defaultValue={valueOf(f)} placeholder={f.placeholder} />;
      case "lines":
        return (
          <textarea
            {...common}
            rows={f.rows ?? 4}
            className="input"
            defaultValue={Array.isArray(initial[f.name]) ? (initial[f.name] as string[]).join("\n") : ""}
            placeholder={f.placeholder}
          />
        );
      case "richtext":
        return <RichTextEditor name={f.name} initial={String(valueOf(f))} label={f.label} />;
      case "number":
        return <input {...common} type="number" step={f.step ?? "1"} className="input" defaultValue={valueOf(f)} />;
      case "boolean":
        return (
          <label className="flex items-center gap-2 text-sm">
            <input {...common} type="checkbox" defaultChecked={Boolean(valueOf(f))} className="h-4 w-4 accent-forest" />
            <span>{f.label}</span>
          </label>
        );
      case "date":
        return <input {...common} type="date" className="input" defaultValue={valueOf(f)} />;
      case "datetime":
        return <DatetimeField id={inputId} name={f.name} initial={String(initial[f.name] ?? "")} />;
      case "select":
        return (
          <select {...common} className="input" defaultValue={String(valueOf(f))}>
            {!f.required && <option value="">None</option>}
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "relation":
        return (
          <select {...common} className="input" defaultValue={String(valueOf(f))}>
            <option value="">{f.required ? "Choose..." : "None"}</option>
            {(relationOptions[f.name] ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "file":
        return <FileField name={f.name} spec={f.file!} initial={String(initial[f.name] ?? "")} required={f.required} />;
      case "files":
        return <FilesField name={f.name} spec={f.file!} initial={(Array.isArray(initial[f.name]) ? initial[f.name] : []) as UploadedItem[]} />;
      case "tree":
        return <TreeBuilder name={f.name} initial={normalizeTree(initial[f.name])} />;
      case "tags":
        return <input {...common} type="text" className="input" defaultValue={tagValues[f.name] ?? ""} placeholder="syntax, phonology, fieldwork" />;
      case "children":
        return <ChildrenField name={f.name} spec={f.child!} initial={childRows[f.name] ?? []} />;
      case "url":
        return <input {...common} type="url" className="input" defaultValue={valueOf(f)} placeholder={f.placeholder ?? "https://"} />;
      case "email":
        return <input {...common} type="email" className="input" defaultValue={valueOf(f)} placeholder={f.placeholder} />;
      default:
        return <input {...common} type="text" className="input" defaultValue={valueOf(f)} placeholder={f.placeholder} />;
    }
  }

  const wide = (f: Field) => !f.half;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div ref={topRef} />
      {error && (
        <p role="alert" className="mb-5 rounded border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {resource.fields.map((f) => (
          <div key={f.name} className={wide(f) ? "sm:col-span-2" : ""}>
            {f.type !== "boolean" && (
              <label htmlFor={`f-${f.name}`} className="label">
                {f.label}
                {f.required && <span className="text-danger"> *</span>}
              </label>
            )}
            {renderInput(f)}
            {f.help && <p className="help">{f.help}</p>}
            {fieldErrors[f.name] && <p className="field-error">{fieldErrors[f.name]}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving..." : id ? "Save changes" : "Create"}
        </button>
        {!resource.singleton && (
          <Link href={`/admin/${resource.key}`} className="btn btn-outline">
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
