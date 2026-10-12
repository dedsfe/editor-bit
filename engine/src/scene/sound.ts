// Sons de ambiente e efeitos (cue "sound"): função pura que diz o que toca, quando e em que volume.
// O export (ffmpeg, scripts/build.mjs) e o preview do editor (Web Audio) usam o MESMO plano,
// então o que se ouve no editor é o que sai no MP4. Os arquivos vêm de sons/manifest.json.
import type { Build, Cue, Scene, TimeRef } from "./types.ts";
import { parseRef } from "./time.ts";

/** Uma entrada de sons/manifest.json (só o que a engine usa). */
export interface SoundInfo { id: string; arquivo: string; duracao: number; loop: boolean; tags?: string[] }

export interface SoundPlay {
  id: string;
  /** caminho relativo a sons/ */
  file: string;
  /** começa (s, absoluto) e quanto toca */
  start: number;
  len: number;
  loop: boolean;
  volume: number;
  fade: number;
  /** multiplicador do volume enquanto alguém fala (1 = não abaixa) */
  duck: number;
}

/** Trechos em que tem voz (com folga), já unidos quando se encostam. */
export const DUCK_RAMP = 0.25;
export function voiceRanges(build: Build): [number, number][] {
  const r = build.lines.map((l) => [l.voiceStart - 0.1, l.voiceEnd + 0.2] as [number, number]).sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const x of r) {
    const last = out[out.length - 1];
    if (last && x[0] <= last[1] + DUCK_RAMP * 2) last[1] = Math.max(last[1], x[1]);
    else out.push([...x]);
  }
  return out;
}

function time(ref: TimeRef, build: Build): number {
  const p = parseRef(ref, (id) => build.lines.some((l) => l.id === id));
  if (p === null) return NaN;
  if (typeof p === "number") return p;
  const l = build.lines.find((l) => l.id === p.line)!;
  return (p.at === "end" ? l.voiceEnd : l.voiceStart) + p.offset;
}

export function soundPlan(scene: Scene, build: Build, manifest: SoundInfo[]): SoundPlay[] {
  const out: SoundPlay[] = [];
  for (const c of scene.cues ?? []) {
    if (c.type !== "sound") continue;
    const info = manifest.find((m) => m.id === c.sound);
    const start = time(c.at, build);
    if (!info || !Number.isFinite(start) || start >= build.duration) continue;
    const until = c.until !== undefined ? time(c.until, build) : NaN;
    const loop = c.loop ?? info.loop;
    const end = Math.min(build.duration, Number.isFinite(until) ? until : loop ? build.duration : start + info.duracao);
    if (end <= start) continue;
    out.push({
      id: info.id, file: info.arquivo, start, len: end - start, loop,
      volume: c.volume ?? 0.5,
      fade: Math.min(c.fade ?? (loop ? 0.5 : 0), (end - start) / 2),
      duck: c.duck ?? (loop ? 0.45 : 1),
    });
  }
  return out;
}

/** Ganho de um som no tempo absoluto t (volume × fades × abaixar na voz). Igual ao filtro do ffmpeg. */
export function soundGain(s: SoundPlay, t: number, ranges: [number, number][]): number {
  const k = t - s.start;
  if (k < 0 || k > s.len) return 0;
  let g = s.volume;
  if (s.fade > 0) g *= Math.min(1, k / s.fade, (s.len - k) / s.fade);
  if (s.duck < 1) g *= 1 - (1 - s.duck) * duckAmount(t, ranges);
  return g;
}

/** 0 = ninguém falando, 1 = no meio de uma fala (rampa de DUCK_RAMP nas bordas). */
export function duckAmount(t: number, ranges: [number, number][]): number {
  let d = 0;
  for (const [a, b] of ranges) d = Math.max(d, Math.min(1, Math.max(0, Math.min((t - a + DUCK_RAMP) / DUCK_RAMP, (b + DUCK_RAMP - t) / DUCK_RAMP))));
  return d;
}

export type SoundCue = Extract<Cue, { type: "sound" }>;
