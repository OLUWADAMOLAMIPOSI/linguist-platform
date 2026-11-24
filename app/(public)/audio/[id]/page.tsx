import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { signedUrl } from "@/lib/storage";
import { PageHeader } from "@/components/ui/common";
import { AudioPlayer, type Segment } from "@/components/audio/audio-player";
import { Interlinear } from "@/components/linguistic-labs/interlinear";
import { formatDate, truncate, type Row } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const db = createPublicClient();
  // Row Level Security only returns published recordings with documented consent.
  const { data, error } = await db
    .from("audio_recordings")
    .select("*, languages(name, slug), audio_transcriptions(*), interlinear_glosses(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Loading recording: ${error.message}`);
  return data as Row | null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const r = await load(params.id);
  if (!r) return { title: "Recording not found" };
  return buildMetadata({ path: `/audio/${r.id}`, title: r.title, description: truncate(r.description, 160) });
}

export default async function RecordingPage({ params }: { params: { id: string } }) {
  const rec = await load(params.id);
  if (!rec) notFound();

  const url = await signedUrl("linguistic-recordings", rec.file_path, 3600);
  const segments: Segment[] = ((rec.audio_transcriptions ?? []) as Row[])
    .slice()
    .sort((a, b) => Number(a.start_seconds) - Number(b.start_seconds))
    .map((s) => ({
      id: s.id,
      start_seconds: Number(s.start_seconds),
      end_seconds: Number(s.end_seconds),
      speaker_label: s.speaker_label,
      orthographic: s.orthographic,
      phonetic: s.phonetic,
      translation: s.translation,
      notes: s.notes,
    }));

  return (
    <>
      <PageHeader
        eyebrow={rec.languages?.name ?? "Recording"}
        title={rec.title}
        intro={[rec.speaker_label && `Speaker ${rec.speaker_label}`, rec.location, rec.recorded_on && formatDate(rec.recorded_on)].filter(Boolean).join(" · ") || undefined}
      />
      <div className="container-page max-w-3xl space-y-10 py-10">
        {rec.description && <p className="leading-7">{rec.description}</p>}

        {url ? (
          <AudioPlayer src={url} segments={segments} />
        ) : (
          <p className="rounded border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            The audio file could not be loaded right now. Please try again later.
          </p>
        )}

        {(rec.orthographic_transcription || rec.phonetic_transcription || rec.translation) && (
          <section className="space-y-5">
            <h2 className="text-xl">Full transcription</h2>
            {rec.orthographic_transcription && (
              <div>
                <p className="eyebrow mb-1">Orthographic</p>
                <p className="whitespace-pre-wrap font-ipa leading-7">{rec.orthographic_transcription}</p>
              </div>
            )}
            {rec.phonetic_transcription && (
              <div>
                <p className="eyebrow mb-1">Phonetic</p>
                <p className="whitespace-pre-wrap font-ipa leading-7">{rec.phonetic_transcription}</p>
              </div>
            )}
            {rec.translation && (
              <div>
                <p className="eyebrow mb-1">Translation</p>
                <p className="whitespace-pre-wrap leading-7">{rec.translation}</p>
              </div>
            )}
          </section>
        )}

        {rec.interlinear_glosses?.is_published && (
          <section>
            <h2 className="mb-3 text-xl">Linked linguistic example</h2>
            <Interlinear gloss={rec.interlinear_glosses} />
          </section>
        )}

        <p className="text-sm">
          <Link href="/audio" className="link">
            Back to the audio library
          </Link>
          {rec.languages && (
            <>
              {" · "}
              <Link href={`/languages/${rec.languages.slug}`} className="link">
                {rec.languages.name} profile
              </Link>
            </>
          )}
        </p>
      </div>
    </>
  );
}
