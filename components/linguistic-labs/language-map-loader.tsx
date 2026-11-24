"use client";

import dynamic from "next/dynamic";
import type { MapLanguage } from "@/components/linguistic-labs/language-map";

const LanguageMap = dynamic(() => import("@/components/linguistic-labs/language-map"), {
  ssr: false,
  loading: () => <div className="flex h-[28rem] items-center justify-center rounded border border-line bg-sand/40 text-sm text-muted">Loading map...</div>,
});

export function LanguageMapLoader({ languages }: { languages: MapLanguage[] }) {
  return <LanguageMap languages={languages} />;
}
