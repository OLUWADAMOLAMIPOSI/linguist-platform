import Link from "next/link";
import { must, PAGE_SIZE, range } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, FilterBar, PageHeader, Pagination, SearchFilter, SelectFilter } from "@/components/ui/common";
import { cleanSearch, firstParam, formatDate, pageParam, truncate, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/audio", title: "Audio and transcription library", description: "Recordings with transcriptions and translations." });
}

type SP = { [key: string]: string | string[] | undefined };

export default async function AudioLibraryPage({ searchParams }: { searchParams: SP }) {
  const db = createPublicClient();
  const q = cleanSearch(searchParams.q);
  const language = firstParam(searchParams.language);
  const page = pageParam(searchParams.page);

  const languages = await must<Row[]>(db.from("languages").select("id, name").order("name"), "Loading languages");

  // Row Level Security limits this to published recordings with documented consent.
  let query = db
    .from("audio_recordings")
    .select("id, title, description, speaker_label, recorded_on, languages(name)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (language) query = query.eq("language_id", language);

  const [from, to] = range(page);
  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(`Loading recordings: ${error.message}`);
  const recordings = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        eyebrow="Language documentation"
        title="Audio and transcription library"
        intro="Recordings shared with the informed consent of speakers and communities."
      />
      <div className="container-page py-10">
        <FilterBar action="/audio">
          <SearchFilter value={q} placeholder="Title or description" />
          {languages.length > 0 && <SelectFilter name="language" label="Language" value={language} options={languages.map((l) => ({ value: l.id, label: l.name }))} />}
        </FilterBar>

        {recordings.length === 0 ? (
          <EmptyState title="No recordings available" text="Recordings appear here once they are published and consent is documented." />
        ) : (
          <ul className="divide-y divide-line rounded border border-line bg-paper">
            {recordings.map((r) => (
              <li key={r.id}>
                <Link href={`/audio/${r.id}`} className="block px-4 py-4 hover:bg-sand/40">
                  <p className="font-serif text-lg text-forest-dark">{r.title}</p>
                  <p className="text-xs text-muted">
                    {[r.languages?.name, r.speaker_label && `Speaker ${r.speaker_label}`, r.recorded_on && formatDate(r.recorded_on)].filter(Boolean).join(" · ")}
                  </p>
                  {r.description && <p className="mt-1 text-sm text-muted">{truncate(r.description, 160)}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/audio" params={{ q, language }} />
      </div>
    </>
  );
}
