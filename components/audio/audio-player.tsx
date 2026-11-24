"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export interface Segment {
  id?: string;
  start_seconds: number;
  end_seconds: number;
  speaker_label: string | null;
  orthographic: string | null;
  phonetic: string | null;
  translation: string | null;
  notes?: string | null;
}

function fmt(t: number): string {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const BARS = 160;

/**
 * Audio player with waveform and time-aligned transcription.
 * The waveform is computed in the browser from the audio file itself. If the browser cannot
 * decode the file the player still works without it.
 */
export function AudioPlayer({
  src,
  segments = [],
  onTime,
}: {
  src: string;
  segments?: Segment[];
  onTime?: (t: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [waveError, setWaveError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState("");

  // Decode the audio for the waveform
  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    setWaveError(false);
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("fetch failed");
        const length = Number(res.headers.get("content-length") ?? 0);
        if (length > 40 * 1024 * 1024) throw new Error("too large");
        const buf = await res.arrayBuffer();
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const decoded = await ctx.decodeAudioData(buf);
        const data = decoded.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / BARS));
        const out: number[] = [];
        for (let i = 0; i < BARS; i++) {
          let max = 0;
          for (let j = 0; j < step; j++) {
            const v = Math.abs(data[i * step + j] ?? 0);
            if (v > max) max = v;
          }
          out.push(max);
        }
        const top = Math.max(...out, 0.0001);
        if (!cancelled) setPeaks(out.map((p) => p / top));
        ctx.close();
      } catch {
        if (!cancelled) setWaveError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const g = canvas.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    const barW = w / peaks.length;
    const progress = duration ? time / duration : 0;
    peaks.forEach((p, i) => {
      const bh = Math.max(2, p * (h - 6));
      g.fillStyle = i / peaks.length <= progress ? "#2f4a3c" : "#b9c4bc";
      g.fillRect(i * barW + 1, (h - bh) / 2, Math.max(1, barW - 2), bh);
    });
  }, [peaks, time, duration]);

  useEffect(draw, [draw]);
  useEffect(() => {
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    setError("");
    if (a.paused) a.play().catch(() => setError("This recording could not be played. The link may have expired; please reload the page."));
    else a.pause();
  }

  function seek(t: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, duration || t));
    setTime(a.currentTime);
  }

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  }

  const active = segments.findIndex((s) => time >= s.start_seconds && time < s.end_seconds);

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            setTime(e.currentTarget.currentTime);
            onTime?.(e.currentTarget.currentTime);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setError("This recording could not be loaded.")}
        />
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggle} className="btn btn-primary" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <div className="min-w-0 flex-1">
            {peaks ? (
              <canvas ref={canvasRef} onClick={onCanvasClick} className="h-14 w-full cursor-pointer" aria-label="Waveform. Click to jump to a position." />
            ) : (
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full accent-forest"
                aria-label="Seek"
              />
            )}
            {!peaks && !waveError && <p className="text-xs text-muted">Preparing waveform...</p>}
          </div>
          <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted">
            {fmt(time)} / {fmt(duration)}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <label htmlFor="rate" className="text-muted">
            Speed
          </label>
          <select
            id="rate"
            value={rate}
            onChange={(e) => {
              const r = Number(e.target.value);
              setRate(r);
              if (audioRef.current) audioRef.current.playbackRate = r;
            }}
            className="input !w-auto !py-1 text-xs"
          >
            {[0.5, 0.75, 1, 1.25, 1.5].map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>

      {segments.length > 0 && (
        <div>
          <h2 className="mb-3 text-xl">Time-aligned transcription</h2>
          <ol className="space-y-2">
            {segments.map((s, i) => (
              <li key={s.id ?? i}>
                <button
                  type="button"
                  onClick={() => {
                    seek(s.start_seconds);
                    audioRef.current?.play().catch(() => undefined);
                  }}
                  className={`w-full rounded border p-3 text-left text-sm transition-colors ${
                    i === active ? "border-forest bg-forest-soft" : "border-line bg-paper hover:bg-sand/40"
                  }`}
                  aria-current={i === active ? "true" : undefined}
                >
                  <span className="mb-1 flex flex-wrap gap-x-3 text-xs text-muted">
                    <span className="tabular-nums">
                      {fmt(s.start_seconds)} – {fmt(s.end_seconds)}
                    </span>
                    {s.speaker_label && <span>Speaker {s.speaker_label}</span>}
                  </span>
                  {s.orthographic && <span className="block font-ipa text-base">{s.orthographic}</span>}
                  {s.phonetic && <span className="block font-ipa text-muted">{s.phonetic}</span>}
                  {s.translation && <span className="block italic">&lsquo;{s.translation}&rsquo;</span>}
                  {s.notes && <span className="mt-1 block text-xs text-muted">{s.notes}</span>}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
