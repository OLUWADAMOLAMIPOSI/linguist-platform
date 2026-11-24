"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Share:</span>
      <a
        className="btn btn-outline btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
      >
        X
      </a>
      <a
        className="btn btn-outline btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
      >
        LinkedIn
      </a>
      <a className="btn btn-outline btn-sm" href={`mailto:?subject=${enc(title)}&body=${enc(url)}`}>
        Email
      </a>
      <button type="button" className="btn btn-outline btn-sm" onClick={copy}>
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
