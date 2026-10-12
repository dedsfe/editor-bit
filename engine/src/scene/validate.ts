// Validação da cena (pura): o `npm run check` usa, e o editor pode usar também.
// Erro = vai quebrar ou ficar errado no vídeo. Aviso = provavelmente não é o que você quer.
import type { Build, Cue, Scene } from "./types.ts";
import type { Skin } from "../skins/types";
import { parseRef } from "./time.ts";
import { Timeline, SPANS } from "./timeline";
import { speakerOf } from "./layout.ts";
import { BUILTIN_GESTURES } from "../skins/animate";

export interface Report { errors: string[]; warnings: string[] }

const REQUIRED: Partial<Record<Cue["type"], string[]>> = {
  walk: ["actor", "x"], face: ["actor", "dir"], sink: ["actor", "depth"], reach: ["actor"], gesture: ["actor", "variant"],
  hold: ["actor", "target"], hook: ["text"], highlight: ["text"], bubble: ["actor", "text"], thought: ["actor", "text"], counter: ["label", "value"], card: ["text"],
  jump: ["actor"], climb: ["actor", "height"], place: ["actor"], set: ["set"], sound: ["sound"],
};
const ACTOR_KEYS = ["actor", "target"];
const UNIT = ["rain", "wind", "fog", "lightning", "daylight", "waves", "swell"];

export function validate(scene: Scene, ctx: { sets: string[]; skins: Record<string, Skin>; sources?: string[]; build?: Build; sounds?: string[] }): Report {
  const errors: string[] = [], warnings: string[] = [];
  const lineIds = new Set(scene.lines.map((l) => l.id));
  const isLine = (id: string) => lineIds.has(id);

  if (!ctx.sets.includes(scene.set?.kind)) errors.push(`cenário "${scene.set?.kind}" não existe (tem: ${ctx.sets.join(", ")})`);
  for (const [id, a] of Object.entries(scene.actors)) {
    if (!ctx.skins[a.skin]) errors.push(`personagem ${id}: skin "${a.skin}" não existe`);
    if (!Number.isFinite(a.x) || !Number.isFinite(a.z)) errors.push(`personagem ${id}: posição inválida`);
  }

  const seen = new Set<string>();
  for (const l of scene.lines) {
    if (seen.has(l.id)) errors.push(`fala ${l.id}: id repetido`);
    seen.add(l.id);
    const sp = speakerOf(l);
    if (!scene.actors[sp]) errors.push(`fala ${l.id}: quem fala ("${sp}") não está nos personagens`);
    if (ctx.sources && !ctx.sources.includes(l.source ?? l.id)) errors.push(`fala ${l.id}: falta o áudio ${scene.audio}/${l.source ?? l.id}`);
    if (!l.text?.trim() && l.caption !== false) warnings.push(`fala ${l.id}: legenda vazia`);
    if (l.trimIn !== undefined && l.trimOut !== undefined && l.trimOut <= l.trimIn) errors.push(`fala ${l.id}: corte invertido`);
    if (l.text && l.text.length > 110) warnings.push(`fala ${l.id}: legenda longa (${l.text.length} letras), vai virar 3+ páginas`);
  }

  const ref = (where: string, v: unknown) => {
    if (v === undefined) return;
    const p = parseRef(v as never, isLine);
    if (p === null) errors.push(`${where}: tempo "${typeof v === "object" ? JSON.stringify(v) : v}" não bate com nenhuma fala`);
  };
  (scene.cues ?? []).forEach((c, i) => {
    const where = `cue #${i} (${c.type})`;
    const rec = c as unknown as Record<string, unknown>;
    ref(`${where} at`, c.at);
    if ("until" in c) ref(`${where} until`, c.until);
    for (const k of REQUIRED[c.type] ?? []) if (rec[k] === undefined || rec[k] === "") errors.push(`${where}: falta "${k}"`);
    for (const k of ACTOR_KEYS) if (typeof rec[k] === "string" && !scene.actors[rec[k] as string]) errors.push(`${where}: personagem "${rec[k]}" não existe`);
    if (c.type === "camera" && c.actor && !scene.actors[c.actor]) errors.push(`${where}: personagem "${c.actor}" não existe`);
    if (c.type === "camera" && c.zoom !== undefined && (c.zoom < 0.5 || c.zoom > 5)) warnings.push(`${where}: zoom ${c.zoom} fora do normal (0.8–4)`);
    if (c.type === "set" && !ctx.sets.includes(c.set?.kind)) errors.push(`${where}: cenário "${c.set?.kind}" não existe`);
    if (c.type === "sound" && ctx.sounds && !ctx.sounds.includes(c.sound)) errors.push(`${where}: som "${c.sound}" não está em sons/manifest.json`);
    if (c.type === "hold" && c.actor === c.target) errors.push(`${where}: segurando a si mesmo`);
    if (c.type === "gesture") {
      const skin = ctx.skins[scene.actors[c.actor]?.skin ?? ""];
      if (skin && !skin.variants?.[c.variant] && !BUILTIN_GESTURES.includes(c.variant)) errors.push(`${where}: a skin ${skin.id} não tem o gesto "${c.variant}"`);
    }
    if (c.type === "weather") for (const k of UNIT) {
      const v = rec[k] as number | undefined;
      if (v !== undefined && (v < 0 || v > 1)) errors.push(`${where}: ${k} = ${v} (tem que ser de 0 a 1)`);
    }
    // regra de fé: Jesus só fala o que está no áudio
    if ((c.type === "bubble" || c.type === "thought") && scene.actors[c.actor]?.skin === "jesus")
      warnings.push(`${where}: balão com texto pro Jesus. As falas dele são só o que está no áudio`);
  });
  for (const k of UNIT) {
    const v = scene.weather?.[k as keyof typeof scene.weather];
    if (v !== undefined && (v < 0 || v > 1)) errors.push(`clima inicial: ${k} = ${v} (0 a 1)`);
  }

  if (ctx.build && !errors.length) {
    const tl = new Timeline(scene, ctx.build);
    if (ctx.build.duration > 60) warnings.push(`duração ${ctx.build.duration.toFixed(1)} s: passa de 60 s`);
    (scene.cues ?? []).forEach((c, i) => {
      const { t, t1 } = tl.span(c);
      if (t > ctx.build!.duration) warnings.push(`cue #${i} (${c.type}) começa em ${t.toFixed(2)} s, depois do fim do vídeo`);
      if (SPANS.includes(c.type) && t1 <= t) errors.push(`cue #${i} (${c.type}): "until" (${t1.toFixed(2)} s) vem antes do início (${t.toFixed(2)} s)`);
    });
    const b = ctx.build.lines;
    for (let i = 1; i < b.length; i++)
      if (b[i].voiceStart < b[i - 1].voiceEnd - 0.05) warnings.push(`falas ${b[i - 1].id} e ${b[i].id} se sobrepõem`);
  }
  return { errors, warnings };
}
