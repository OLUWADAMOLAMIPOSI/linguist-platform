"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ChildSpec } from "@/lib/admin/resources";

type RowData = Record<string, string>;

/** Repeating group of fields (authors, collaborators, dialects, example sentences). */
export function ChildrenField({ name, spec, initial }: { name: string; spec: ChildSpec; initial: RowData[] }) {
  const empty = () => Object.fromEntries(spec.fields.map((f) => [f.name, ""])) as RowData;
  const [rows, setRows] = useState<RowData[]>(initial.length ? initial : []);

  const update = (i: number, key: string, value: string) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded border border-line bg-paper p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {spec.fields.map((f) => (
                <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`${name}-${i}-${f.name}`} className="label">
                    {f.label}
                    {f.required && <span className="text-danger"> *</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea id={`${name}-${i}-${f.name}`} rows={2} className="input" value={row[f.name] ?? ""} onChange={(e) => update(i, f.name, e.target.value)} />
                  ) : (
                    <input
                      id={`${name}-${i}-${f.name}`}
                      type={f.type === "url" ? "url" : "text"}
                      className="input"
                      value={row[f.name] ?? ""}
                      onChange={(e) => update(i, f.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={i === 0}
                onClick={() => setRows((prev) => {
                  const next = [...prev];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  return next;
                })}
              >
                Move up
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-outline mt-3" onClick={() => setRows((prev) => [...prev, empty()])}>
        <Plus size={14} /> {spec.addLabel}
      </button>
    </div>
  );
}
