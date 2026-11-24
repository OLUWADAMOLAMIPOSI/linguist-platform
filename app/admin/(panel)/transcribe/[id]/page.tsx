import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { TranscribeTool, type SegmentRow } from "@/components/admin/transcribe-tool";
import type { Row } from "@/lib/utils";

export const metadata = { title: "Transcription tool" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TranscribePage({ params }: { params: { id: string } }) {
  await requireStaff();
  if (!UUID.test(params.id)) notFound();

  const supabase = createClient();
  const { data: rec, error } = await supabase.from("audio_recordings").select("id, title").eq("id", params.id).maybeSingle();
  if (error) throw new Error(`Loading recording: ${error.message}`);
  if (!rec) notFound();

  const { data: segs, error: segError } = await supabase.from("audio_transcriptions").select("*").eq("recording_id", params.id).order("start_seconds");
  if (segError) throw new Error(`Loading transcription: ${segError.message}`);

  const initial: SegmentRow[] = ((segs ?? []) as Row[]).map((s) => ({
    start_seconds: Number(s.start_seconds),
    end_seconds: Number(s.end_seconds),
    speaker_label: s.speaker_label ?? "",
    orthographic: s.orthographic ?? "",
    phonetic: s.phonetic ?? "",
    translation: s.translation ?? "",
    notes: s.notes ?? "",
  }));

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/audio-recordings/${params.id}`} className="link text-sm">
        Back to the recording
      </Link>
      <p className="eyebrow mb-1 mt-4">Audio</p>
      <h1 className="mb-2 text-3xl">Transcribe: {rec.title}</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Listen, mark where each segment starts and ends, and type the orthographic, phonetic and translated text. Transcription is done
        manually; no speech recognition service is connected.
      </p>
      <TranscribeTool recordingId={params.id} initial={initial} />
    </div>
  );
}
