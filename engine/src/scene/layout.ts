// Monta a linha do tempo a partir da cena + análise dos áudios. Função pura:
// roda no Node (npm run build) e no navegador (editor) e dá exatamente o mesmo resultado.
import type { Scene, Analysis, Build, BuildLine } from "./types.ts";

export const FPS = 30;

export const speakerOf = (l: { id: string; speaker?: string; source?: string }) =>
  l.speaker ?? (l.source ?? l.id).split("-").slice(1).join("-");

export function layout(scene: Scene, analyses: Record<string, Analysis>, audio = ""): Build {
  const lines: BuildLine[] = [];
  let prevEnd: number | null = null;
  let lastEnd = 0;
  for (const [i, def] of scene.lines.entries()) {
    const source = def.source ?? def.id;
    const a = analyses[source];
    if (!a) throw new Error(`sem análise do áudio "${source}"`);
    const trimIn = def.trimIn ?? 0, trimOut = Math.min(def.trimOut ?? a.dur, a.dur);
    const clipDur = Math.max(0.05, trimOut - trimIn);
    // voz dentro do recorte
    const onset = Math.min(Math.max(a.onset - trimIn, 0), clipDur);
    const offset = Math.max(Math.min(a.offset, trimOut) - trimIn, onset);
    let clipStart: number;
    if (def.start !== undefined) clipStart = def.start;
    else {
      const gap = i === 0 ? 0 : def.gap ?? scene.gap ?? 0.3;
      const voiceStart = prevEnd === null ? Math.max(scene.intro ?? 1, onset) : prevEnd + gap;
      clipStart = voiceStart - onset;
    }
    const voiceEnd = clipStart + offset;
    prevEnd = voiceEnd;
    lastEnd = Math.max(lastEnd, voiceEnd);
    const f0 = Math.round(trimIn * FPS);
    lines.push({
      id: def.id, speaker: speakerOf(def), source,
      clipStart: round(clipStart), clipDur: round(clipDur), trimIn: round(trimIn), volume: def.volume ?? 1,
      voiceStart: round(clipStart + onset), voiceEnd: round(voiceEnd),
      mouth: a.mouth.slice(f0, f0 + Math.ceil(clipDur * FPS)),
    });
  }
  const duration = round((lines.length ? lastEnd : scene.intro ?? 0) + (scene.outro ?? 1.5));
  return { scene: scene.id, fps: FPS, duration, audio, lines };
}

const round = (n: number) => Math.round(n * 10000) / 10000;
