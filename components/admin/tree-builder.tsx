"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Plus, Trash2, Wand2 } from "lucide-react";
import { NODE_H, NODE_W, type TreeData, type TreeNode } from "@/components/linguistic-labs/tree-view";

function newId(): string {
  return "n" + Math.random().toString(36).slice(2, 9);
}

/** Tidy top-down layout: leaves are spaced evenly and each parent is centred above its children. */
function autoLayout(data: TreeData): TreeData {
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  data.edges.forEach((e) => {
    (children.get(e.from) ?? children.set(e.from, []).get(e.from)!).push(e.to);
    hasParent.add(e.to);
  });
  const roots = data.nodes.filter((n) => !hasParent.has(n.id));
  const pos = new Map<string, { x: number; y: number }>();
  let nextLeaf = 0;
  const GAP_X = NODE_W + 24;
  const GAP_Y = NODE_H + 50;
  const seen = new Set<string>();

  const place = (id: string, depth: number): number => {
    seen.add(id);
    const kids = (children.get(id) ?? []).filter((k) => !seen.has(k));
    let x: number;
    if (kids.length === 0) {
      x = nextLeaf++ * GAP_X;
    } else {
      const xs = kids.map((k) => place(k, depth + 1));
      x = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    pos.set(id, { x, y: depth * GAP_Y });
    return x;
  };
  roots.forEach((r) => place(r.id, 0));
  data.nodes.filter((n) => !seen.has(n.id)).forEach((n) => place(n.id, 0));

  return {
    ...data,
    nodes: data.nodes.map((n) => {
      const p = pos.get(n.id)!;
      return { ...n, x: Math.round(p.x + NODE_W), y: Math.round(p.y + NODE_H + 10) };
    }),
  };
}

function descendants(edges: TreeData["edges"], id: string): Set<string> {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of edges) {
      if (out.has(e.from) && !out.has(e.to)) {
        out.add(e.to);
        grew = true;
      }
    }
  }
  return out;
}

export function TreeBuilder({ name, initial }: { name: string; initial: TreeData }) {
  const [data, setData] = useState<TreeData>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const sel = data.nodes.find((n) => n.id === selected) ?? null;
  const parentEdge = sel ? data.edges.find((e) => e.to === sel.id) : undefined;

  const view = useMemo(() => {
    const maxX = Math.max(0, ...data.nodes.map((n) => n.x)) + NODE_W;
    const maxY = Math.max(0, ...data.nodes.map((n) => n.y)) + NODE_H * 2;
    return { w: Math.max(760, maxX + 40), h: Math.max(380, maxY + 40) };
  }, [data.nodes]);

  function svgPoint(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function addNode() {
    setMessage("");
    const id = newId();
    if (sel) {
      const siblings = data.edges.filter((e) => e.from === sel.id).length;
      const node: TreeNode = { id, label: "X", x: sel.x + siblings * (NODE_W + 20) - (siblings > 0 ? 0 : 0), y: sel.y + NODE_H + 50 };
      setData((d) => ({ nodes: [...d.nodes, node], edges: [...d.edges, { from: sel.id, to: id }] }));
    } else {
      const node: TreeNode = { id, label: data.nodes.length === 0 ? "S" : "X", x: 380 + data.nodes.length * 30, y: 40 };
      setData((d) => ({ ...d, nodes: [...d.nodes, node] }));
    }
    setSelected(id);
  }

  function removeNode() {
    if (!sel) return;
    const gone = descendants(data.edges, sel.id);
    const count = gone.size;
    if (count > 1 && !window.confirm(`This will remove this node and its ${count - 1} descendant node(s). Continue?`)) return;
    setData((d) => ({
      nodes: d.nodes.filter((n) => !gone.has(n.id)),
      edges: d.edges.filter((e) => !gone.has(e.from) && !gone.has(e.to)),
    }));
    setSelected(null);
  }

  function setParent(parentId: string) {
    if (!sel) return;
    setMessage("");
    if (parentId && descendants(data.edges, sel.id).has(parentId)) {
      setMessage("A node cannot be attached beneath one of its own descendants.");
      return;
    }
    setData((d) => {
      const edges = d.edges.filter((e) => e.to !== sel.id);
      if (parentId) edges.push({ from: parentId, to: sel.id });
      return { ...d, edges };
    });
  }

  function exportImage(kind: "png" | "svg") {
    setMessage("");
    const svg = svgRef.current;
    if (!svg || data.nodes.length === 0) {
      setMessage("There is nothing to export yet.");
      return;
    }
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll("[data-ui]").forEach((el) => el.remove());
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(view.w));
    clone.setAttribute("height", String(view.h));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>${new XMLSerializer().serializeToString(clone)}`;
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const download = (href: string, file: string) => {
      const a = document.createElement("a");
      a.href = href;
      a.download = file;
      a.click();
    };
    if (kind === "svg") {
      download(url, "syntax-tree.svg");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = view.w * 2;
      canvas.height = view.h * 2;
      const g = canvas.getContext("2d");
      if (!g) {
        setMessage("Your browser could not create the image.");
        return;
      }
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => {
        if (!b) {
          setMessage("Your browser could not create the image.");
          return;
        }
        const pngUrl = URL.createObjectURL(b);
        download(pngUrl, "syntax-tree.png");
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setMessage("The image could not be generated.");
    img.src = url;
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(data)} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={addNode}>
          <Plus size={14} /> {sel ? "Add child node" : "Add node"}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={removeNode} disabled={!sel}>
          <Trash2 size={14} /> Delete node
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setData((d) => autoLayout(d))} disabled={data.nodes.length === 0}>
          <Wand2 size={14} /> Tidy layout
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => exportImage("png")}>
          <Download size={14} /> PNG
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => exportImage("svg")}>
          <Download size={14} /> SVG
        </button>
      </div>

      {sel ? (
        <div className="mb-3 grid gap-3 rounded border border-line bg-paper p-3 sm:grid-cols-2">
          <div>
            <label htmlFor="node-label" className="label">
              Label (e.g. S, NP, VP, N, V)
            </label>
            <input
              id="node-label"
              className="input"
              value={sel.label}
              maxLength={60}
              onChange={(e) => setData((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === sel.id ? { ...n, label: e.target.value } : n)) }))}
            />
          </div>
          <div>
            <label htmlFor="node-parent" className="label">
              Parent node
            </label>
            <select id="node-parent" className="input" value={parentEdge?.from ?? ""} onChange={(e) => setParent(e.target.value)}>
              <option value="">None (top of the tree)</option>
              {data.nodes
                .filter((n) => n.id !== sel.id)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label || "(empty)"} ({n.id.slice(1, 5)})
                  </option>
                ))}
            </select>
          </div>
        </div>
      ) : (
        <p className="help mb-3">Click a node to select it. With a node selected you can rename it, change its parent or add a child. Drag nodes to reposition them.</p>
      )}
      {message && <p className="field-error mb-2">{message}</p>}

      <div className="overflow-auto rounded border border-line bg-white">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${view.w} ${view.h}`}
          width={view.w}
          height={view.h}
          className="touch-none select-none"
          role="application"
          aria-label="Syntax tree canvas"
          onPointerMove={(e) => {
            if (!drag.current) return;
            const p = svgPoint(e);
            const { id, dx, dy } = drag.current;
            setData((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, x: Math.round(p.x - dx), y: Math.round(p.y - dy) } : n)) }));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <rect data-ui width={view.w} height={view.h} fill="#ffffff" pointerEvents="none" />
          {data.edges.map((e, i) => {
            const a = data.nodes.find((n) => n.id === e.from);
            const b = data.nodes.find((n) => n.id === e.to);
            if (!a || !b) return null;
            return <line key={i} x1={a.x} y1={a.y + NODE_H / 2} x2={b.x} y2={b.y - NODE_H / 2} stroke="#8a948e" strokeWidth={1.5} />;
          })}
          {data.nodes.map((n) => (
            <g
              key={n.id}
              tabIndex={0}
              role="button"
              aria-label={`Node ${n.label || "empty"}`}
              className="cursor-grab"
              onPointerDown={(e) => {
                e.stopPropagation();
                const p = svgPoint(e);
                drag.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y };
                setSelected(n.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelected(n.id);
              }}
            >
              <rect
                x={n.x - NODE_W / 2}
                y={n.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={3}
                fill={n.id === selected ? "#e4ebe5" : "#fffdf8"}
                stroke="#2f4a3c"
                strokeWidth={n.id === selected ? 2.2 : 1.2}
              />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={13} fill="#27332d" fontFamily="Charis SIL, Georgia, serif" pointerEvents="none">
                {n.label.length > 11 ? n.label.slice(0, 10) + "…" : n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
