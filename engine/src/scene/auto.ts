// Botões automáticos: geram cues normais (aparecem e editam na timeline como qualquer outro).
// Cada cue gerado leva `auto`, assim apertar o botão de novo substitui só o que ele mesmo criou.
import type { Build, CameraShot, Cue, Scene } from "./types.ts";
import { formatRef } from "./time.ts";

/** Câmera segue quem fala: um corte/transição pro personagem antes de cada fala de outra pessoa. */
export function followSpeaker(scene: Scene, build: Build, o: { shot?: CameraShot; lead?: number; dur?: number } = {}): Cue[] {
  const { shot = "medium", lead = 0.25, dur = 0.5 } = o;
  const keep = (scene.cues ?? []).filter((c) => c.auto !== "follow");
  const out: Cue[] = [];
  let prev = "";
  for (const l of [...build.lines].sort((a, b) => a.voiceStart - b.voiceStart)) {
    if (l.speaker === prev || !scene.actors[l.speaker]) continue;
    prev = l.speaker;
    out.push({ type: "camera", at: formatRef({ line: l.id, at: "start", offset: -lead }), actor: l.speaker, shot, dur, auto: "follow" });
  }
  return [...keep, ...out];
}
