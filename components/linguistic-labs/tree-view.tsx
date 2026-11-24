export interface TreeNode {
  id: string;
  label: string;
  x: number;
  y: number;
}
export interface TreeEdge {
  from: string;
  to: string;
}
export interface TreeData {
  nodes: TreeNode[];
  edges: TreeEdge[];
}

export function normalizeTree(raw: unknown): TreeData {
  const r = (raw ?? {}) as Partial<TreeData>;
  return {
    nodes: Array.isArray(r.nodes) ? r.nodes : [],
    edges: Array.isArray(r.edges) ? r.edges : [],
  };
}

export const NODE_W = 76;
export const NODE_H = 30;

/** Read-only SVG rendering of a saved syntax tree. The builder uses the same coordinates. */
export function TreeView({ data, title }: { data: TreeData; title?: string }) {
  if (data.nodes.length === 0) return null;
  const pad = 20;
  const minX = Math.min(...data.nodes.map((n) => n.x)) - NODE_W / 2 - pad;
  const maxX = Math.max(...data.nodes.map((n) => n.x)) + NODE_W / 2 + pad;
  const minY = Math.min(...data.nodes.map((n) => n.y)) - NODE_H / 2 - pad;
  const maxY = Math.max(...data.nodes.map((n) => n.y)) + NODE_H / 2 + pad;
  const byId = new Map(data.nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      role="img"
      aria-label={title ? `Syntax tree: ${title}` : "Syntax tree"}
      className="mx-auto h-auto max-h-[28rem] w-full max-w-3xl"
    >
      {data.edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        return <line key={i} x1={a.x} y1={a.y + NODE_H / 2} x2={b.x} y2={b.y - NODE_H / 2} stroke="#8a948e" strokeWidth={1.5} />;
      })}
      {data.nodes.map((n) => (
        <g key={n.id}>
          <rect x={n.x - NODE_W / 2} y={n.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={3} fill="#fffdf8" stroke="#2f4a3c" strokeWidth={1.2} />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={13} fill="#27332d" fontFamily="Charis SIL, Georgia, serif">
            {n.label.length > 11 ? n.label.slice(0, 10) + "…" : n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
