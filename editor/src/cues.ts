// Tudo que o editor sabe sobre cada tipo de cue: em que trilha fica, nome, cor e campos do inspetor.
import type { Build, Cue, CueType, Scene, TimeRef } from "../../engine/src/scene/types.ts";
import type { Timeline } from "../../engine/src/scene/timeline";
import { formatRef, shiftRef } from "../../engine/src/scene/time.ts";
import type { SoundInfo } from "../../engine/src/scene/sound.ts";

/** Biblioteca de sons (sons/manifest.json), carregada pelo main. As opções do inspetor apontam pra cá. */
export const SOUNDS: SoundInfo[] = [];
const SOUND_OPTIONS: [string, string][] = [];
export function setSounds(list: SoundInfo[]) {
  SOUNDS.splice(0, SOUNDS.length, ...list);
  SOUND_OPTIONS.splice(0, SOUND_OPTIONS.length, ...list.map((s): [string, string] => [s.id, `${s.loop ? "🔁 " : ""}${s.id.replace(/_/g, " ")}`]));
}

export type Track = "camera" | "cena" | "acoes" | "tela" | "sons";

export type Field =
  | { key: string; label: string; kind: "number"; min: number; max: number; step: number; optional?: boolean; hint?: string }
  | { key: string; label: string; kind: "text"; long?: boolean }
  | { key: string; label: string; kind: "actor"; optional?: boolean }
  | { key: string; label: string; kind: "select"; options: [string | number | boolean, string][]; optional?: boolean }
  | { key: string; label: string; kind: "color"; optional?: boolean }
  | { key: string; label: string; kind: "until" }
  | { key: string; label: string; kind: "set" };

interface Meta { label: string; track: Track; icon: string; fields: Field[] }

const W = (key: string, label: string): Field => ({ key, label, kind: "number", min: 0, max: 1, step: 0.05, optional: true });

export const CUE_META: Record<CueType, Meta> = {
  camera: {
    label: "Câmera", track: "camera", icon: "◉", fields: [
      { key: "actor", label: "Enquadrar", kind: "actor", optional: true },
      { key: "shot", label: "Plano", kind: "select", optional: true, options: [["close", "Close no rosto"], ["medium", "Plano médio"], ["wide", "Plano geral"]] },
      { key: "dur", label: "Transição (s)", kind: "number", min: 0, max: 5, step: 0.1, hint: "0 = corte seco" },
      { key: "x", label: "Centro X", kind: "number", min: -60, max: 260, step: 1, optional: true },
      { key: "y", label: "Centro Y", kind: "number", min: 60, max: 320, step: 1, optional: true },
      { key: "zoom", label: "Zoom", kind: "number", min: 0.8, max: 4, step: 0.05, optional: true },
    ],
  },
  shake: {
    label: "Tremor", track: "camera", icon: "≋", fields: [
      { key: "amp", label: "Intensidade (px)", kind: "number", min: 0.5, max: 10, step: 0.5 },
      { key: "dur", label: "Duração (s)", kind: "number", min: 0.1, max: 4, step: 0.1 },
    ],
  },
  weather: {
    label: "Clima", track: "cena", icon: "☁", fields: [
      { key: "dur", label: "Transição (s)", kind: "number", min: 0, max: 10, step: 0.1 },
      W("rain", "Chuva"), W("wind", "Vento"), W("fog", "Neblina"), W("lightning", "Relâmpagos automáticos"),
      W("daylight", "Hora (0 noite → 1 amanhecer)"), W("waves", "Ondas"), W("swell", "Onda gigante"),
    ],
  },
  lightning: {
    label: "Relâmpago", track: "cena", icon: "ϟ", fields: [
      { key: "strength", label: "Força", kind: "number", min: 0.2, max: 1.5, step: 0.05 },
    ],
  },
  walk: {
    label: "Andar", track: "acoes", icon: "→", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "x", label: "Até X", kind: "number", min: -60, max: 300, step: 1 },
      { key: "z", label: "Até profundidade", kind: "number", min: -40, max: 120, step: 1, optional: true },
      { key: "speed", label: "Velocidade (px/s)", kind: "number", min: 2, max: 120, step: 1 },
      { key: "hop", label: "Pulo (descer/subir no barco)", kind: "number", min: 0, max: 24, step: 1, optional: true },
    ],
  },
  face: {
    label: "Virar", track: "acoes", icon: "⇆", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "dir", label: "Olhar para", kind: "select", options: [[1, "Direita"], [-1, "Esquerda"]] },
    ],
  },
  sink: {
    label: "Afundar", track: "acoes", icon: "⇣", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "depth", label: "Profundidade (px, 0 = sobe)", kind: "number", min: 0, max: 44, step: 1 },
      { key: "dur", label: "Duração (s)", kind: "number", min: 0.1, max: 5, step: 0.1 },
    ],
  },
  reach: {
    label: "Estender a mão", track: "acoes", icon: "✋", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  gesture: {
    label: "Gesto", track: "acoes", icon: "✋", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "variant", label: "Gesto", kind: "select", options: [["reach", "Braço esticado / apontar"], ["lookup", "Olhar pra cima"], ["pray", "Orar de braços abertos"], ["kneel", "Ajoelhar e orar"]] },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  hold: {
    label: "Segurar a mão", track: "acoes", icon: "🤝", fields: [
      { key: "actor", label: "Quem segura", kind: "actor" },
      { key: "target", label: "Quem é segurado", kind: "actor" },
      { key: "glow", label: "Brilho quente nas mãos", kind: "number", min: 0, max: 2, step: 0.05 },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  hook: {
    label: "Texto-gancho", track: "tela", icon: "T", fields: [
      { key: "text", label: "Texto", kind: "text", long: true },
      { key: "color", label: "Cor", kind: "color", optional: true },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  highlight: {
    label: "Destaque grande", track: "tela", icon: "★", fields: [
      { key: "text", label: "Texto", kind: "text" },
      { key: "color", label: "Cor", kind: "color", optional: true },
      { key: "y", label: "Altura na tela", kind: "number", min: 40, max: 280, step: 2, optional: true, hint: "padrão 96" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  bubble: {
    label: "Balão de fala", track: "tela", icon: "💬", fields: [
      { key: "actor", label: "De quem", kind: "actor" },
      { key: "text", label: "Texto", kind: "text" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  thought: {
    label: "Balão de pensamento", track: "tela", icon: "💭", fields: [
      { key: "actor", label: "De quem", kind: "actor" },
      { key: "text", label: "Texto", kind: "text" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  counter: {
    label: "Contador", track: "tela", icon: "#", fields: [
      { key: "label", label: "Rótulo", kind: "text" },
      { key: "value", label: "Valor", kind: "number", min: 0, max: 99, step: 1 },
      { key: "total", label: "Total (barrinha)", kind: "number", min: 1, max: 99, step: 1, optional: true },
      { key: "color", label: "Cor (azul = congelado)", kind: "color", optional: true },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  jump: {
    label: "Pular", track: "acoes", icon: "⤒", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "height", label: "Altura (px)", kind: "number", min: 2, max: 40, step: 1 },
      { key: "times", label: "Quantos pulos", kind: "number", min: 1, max: 8, step: 1 },
      { key: "dur", label: "Duração (s)", kind: "number", min: 0.2, max: 5, step: 0.1 },
    ],
  },
  climb: {
    label: "Subir / descer / cair", track: "acoes", icon: "⇡", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "height", label: "Altura do chão (px, 0 = chão)", kind: "number", min: 0, max: 120, step: 1, hint: "galho da figueira = 72" },
      { key: "x", label: "Indo até X", kind: "number", min: -60, max: 300, step: 1, optional: true },
      { key: "dur", label: "Duração (s)", kind: "number", min: 0.01, max: 5, step: 0.05 },
      { key: "fall", label: "Jeito", kind: "select", optional: true, options: [[true, "Cair de mau jeito"]] },
    ],
  },
  place: {
    label: "Posicionar / esconder", track: "acoes", icon: "⌖", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "x", label: "X", kind: "number", min: -60, max: 300, step: 1, optional: true },
      { key: "z", label: "Profundidade", kind: "number", min: -40, max: 120, step: 1, optional: true },
      { key: "facing", label: "Olhando para", kind: "select", optional: true, options: [[1, "Direita"], [-1, "Esquerda"]] },
      { key: "hidden", label: "Visível", kind: "select", optional: true, options: [[true, "Escondido"], [false, "Aparece"]] },
    ],
  },
  murmur: {
    label: "Multidão cochicha", track: "cena", icon: "…", fields: [
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  set: {
    label: "Trocar cenário", track: "cena", icon: "⇄", fields: [
      { key: "set", label: "Cenário", kind: "set" },
      { key: "fade", label: "Fade pro preto (s)", kind: "number", min: 0, max: 3, step: 0.1, hint: "0 = corte seco" },
    ],
  },
  sound: {
    label: "Som", track: "sons", icon: "♪", fields: [
      { key: "sound", label: "Som", kind: "select", options: SOUND_OPTIONS },
      { key: "volume", label: "Volume", kind: "number", min: 0, max: 1, step: 0.02 },
      { key: "fade", label: "Fade de entrada/saída (s)", kind: "number", min: 0, max: 3, step: 0.1, optional: true },
      { key: "duck", label: "Volume quando alguém fala", kind: "number", min: 0, max: 1, step: 0.05, optional: true, hint: "1 = não abaixa" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  card: {
    label: "Card final", track: "tela", icon: "▭", fields: [
      { key: "text", label: "Texto", kind: "text", long: true },
      { key: "color", label: "Cor", kind: "color", optional: true },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
};

/** O que o "+" de cada trilha oferece. `actor` = precisa escolher pra quem. */
export type AddItem =
  | { kind: "cue"; type: CueType; label: string; actor?: boolean; variant?: string; hint?: string }
  | { kind: "shot"; shot: "close" | "medium" | "wide"; label: string; actor?: boolean; hint?: string }
  | { kind: "follow"; label: string; hint?: string }
  | { kind: "whisper"; label: string; hint?: string };

export const TRACKS: { id: Track; label: string; color: string; add: AddItem[] }[] = [
  {
    id: "camera", label: "Câmera", color: "#4f8cff", add: [
      { kind: "shot", shot: "close", label: "Close no rosto", actor: true },
      { kind: "shot", shot: "medium", label: "Plano médio", actor: true },
      { kind: "shot", shot: "wide", label: "Plano geral" },
      { kind: "follow", label: "Seguir quem fala", hint: "um enquadramento por fala, automático" },
      { kind: "cue", type: "shake", label: "Tremor" },
    ],
  },
  {
    id: "cena", label: "Cena", color: "#1fc7a4", add: [
      { kind: "cue", type: "set", label: "Trocar cenário" },
      { kind: "cue", type: "weather", label: "Clima e hora do dia", hint: "chuva, vento, neblina, ondas, amanhecer" },
      { kind: "cue", type: "lightning", label: "Relâmpago" },
      { kind: "cue", type: "murmur", label: "Multidão cochicha" },
    ],
  },
  {
    id: "acoes", label: "Ações", color: "#ff8a3d", add: [
      { kind: "cue", type: "walk", label: "Andar", actor: true },
      { kind: "cue", type: "jump", label: "Pular", actor: true },
      { kind: "cue", type: "climb", label: "Subir / descer / cair", actor: true },
      { kind: "cue", type: "sink", label: "Afundar", actor: true },
      { kind: "cue", type: "reach", label: "Estender a mão", actor: true },
      { kind: "cue", type: "hold", label: "Segurar a mão", actor: true, hint: "brilho quente nas mãos" },
      { kind: "cue", type: "gesture", variant: "lookup", label: "Olhar pra cima", actor: true },
      { kind: "cue", type: "gesture", variant: "kneel", label: "Ajoelhar e orar", actor: true, hint: "olhos fechados, mãos juntas" },
      { kind: "cue", type: "gesture", variant: "pray", label: "Orar de braços abertos", actor: true, hint: "só quem tem o gesto (Fariseu)" },
      { kind: "cue", type: "face", label: "Virar", actor: true },
      { kind: "cue", type: "place", label: "Posicionar / esconder", actor: true },
    ],
  },
  {
    id: "tela", label: "Tela", color: "#c46bff", add: [
      { kind: "cue", type: "hook", label: "Texto-gancho" },
      { kind: "cue", type: "highlight", label: "Destaque grande", hint: "texto enorme no meio, entra pulando" },
      { kind: "cue", type: "bubble", label: "Balão de fala", actor: true },
      { kind: "cue", type: "thought", label: "Balão de pensamento", actor: true },
      { kind: "cue", type: "counter", label: "Contador" },
      { kind: "cue", type: "card", label: "Card final" },
    ],
  },
  {
    id: "sons", label: "Sons", color: "#e8b04a", add: [
      { kind: "cue", type: "sound", variant: "loop", label: "Ambiente (fica tocando)", hint: "multidão, vento, pássaros, chuva" },
      { kind: "cue", type: "sound", variant: "fx", label: "Efeito (toca uma vez)", hint: "whoosh, impacto, passos, porta" },
    ],
  },
];

export const trackOf = (t: CueType) => TRACKS.find((tr) => tr.id === CUE_META[t].track)!;

/** TimeRef presa à última fala que começou antes de t (assim o cue anda junto se o áudio mudar). */
export function anchorAt(t: number, build: Build): TimeRef {
  const prev = [...build.lines].filter((l) => l.voiceStart <= t + 1e-6).sort((a, b) => b.voiceStart - a.voiceStart)[0];
  if (!prev) return round(t);
  return formatRef({ line: prev.id, at: "start", offset: t - prev.voiceStart });
}

export { shiftRef };

export const round = (n: number) => Math.round(n * 100) / 100;

/** Início/fim de um cue pra desenhar na timeline. */
export function extent(c: Cue, tl: Timeline): { t: number; t1: number } {
  const { t, t1 } = tl.span(c);
  switch (c.type) {
    case "jump": case "climb": return { t, t1: t + Math.max(c.dur ?? (c.type === "jump" ? 1.5 : 1.2), 0.15) };
    case "place": case "set": return { t, t1: t + 0.2 };
    case "camera": case "weather": case "sink": return { t, t1: t + Math.max(c.dur ?? (c.type === "sink" ? 1 : 0), 0.15) };
    case "shake": return { t, t1: t + (c.dur ?? 0.4) };
    case "walk": {
      const from = tl.actor(c.actor, Math.max(0, t - 1e-3));
      const dist = Math.hypot(c.x - from.x, (c.z ?? from.z) - from.z);
      return { t, t1: t + Math.max(dist / (c.speed ?? 24), 0.15) };
    }
    case "face": case "lightning": return { t, t1: t + 0.2 };
    case "sound": {
      if (c.until !== undefined) return { t, t1: Math.min(tl.time(c.until), tl.duration) };
      const info = SOUNDS.find((s) => s.id === c.sound);
      return { t, t1: info && !(c.loop ?? info.loop) ? t + Math.max(info.duracao, 0.2) : tl.duration };
    }
    default: return { t, t1 };
  }
}

/** Resumo curtinho que aparece no bloco da timeline. */
const WEATHER_PT: Record<string, string> = {
  rain: "Chuva", wind: "Vento", fog: "Neblina", lightning: "Relâmpago", daylight: "Dia", waves: "Ondas", swell: "Mar",
};

export function summary(c: Cue, scene: Scene): string {
  const who = (id?: string) => (id ? scene.actors[id]?.name ?? id : "");
  switch (c.type) {
    case "camera": return c.shot ? `${{ close: "Close", medium: "Médio", wide: "Geral" }[c.shot]} ${who(c.actor)}`.trim() : `Zoom ${c.zoom ?? "–"}×`;
    case "shake": return `Tremor ${c.amp ?? 3}`;
    case "weather": return Object.entries(c).filter(([k]) => k in WEATHER_PT).map(([k, v]) => `${WEATHER_PT[k]} ${Math.round(Number(v) * 100)}%`).join(" · ");
    case "lightning": return "⚡";
    case "walk": return `${who(c.actor)} → ${c.x}${c.hop ? " (pulo)" : ""}`;
    case "face": return `${who(c.actor)} ${c.dir > 0 ? "→" : "←"}`;
    case "sink": return `${who(c.actor)} ↓${c.depth}`;
    case "reach": case "gesture": return `${who(c.actor)} ✋`;
    case "hold": return `${who(c.actor)} ✋ ${who(c.target)}`;
    case "hook": case "card": case "highlight": return c.text;
    case "bubble": case "thought": return `${who(c.actor)}: ${c.text}`;
    case "counter": return `${c.label} ${c.value}`;
    case "jump": return `${who(c.actor)} pula ×${c.times ?? 3}`;
    case "climb": return `${who(c.actor)} ${c.fall ? "cai" : c.height > 0 ? `sobe ${c.height}` : "desce"}`;
    case "place": return `${who(c.actor)}${c.hidden ? " (esconde)" : c.hidden === false ? " (aparece)" : ` → ${c.x ?? ""}`}`;
    case "murmur": return "cochicho";
    case "set": return `→ ${c.set.kind}`;
    case "sound": return `${c.sound.replace(/_/g, " ")} ${Math.round((c.volume ?? 0.5) * 100)}%`;
  }
}

/** Cue novo com valores bons, no tempo t. */
export function makeCue(type: CueType, at: TimeRef, ctx: { actor: string; other: string; t: number; tl: Timeline; variant?: string }): Cue {
  const until = shiftRef(at, 2);
  const pos = ctx.tl.actor(ctx.actor, ctx.t);
  switch (type) {
    case "camera": return { type, at, actor: ctx.actor, shot: "medium", dur: 0.6 };
    case "shake": return { type, at, amp: 3, dur: 0.6 };
    case "weather": return { type, at, dur: 3, rain: 0.5 };
    case "lightning": return { type, at, strength: 1 };
    case "walk": return { type, at, actor: ctx.actor, x: round(pos.x + 20), speed: 24 };
    case "face": return { type, at, actor: ctx.actor, dir: -pos.facing as 1 | -1 };
    case "sink": return { type, at, actor: ctx.actor, depth: 20, dur: 1.2 };
    case "reach": return { type, at, actor: ctx.actor, until };
    case "gesture": return { type, at, actor: ctx.actor, variant: ctx.variant ?? "reach", until };
    case "hold": return { type, at, actor: ctx.actor, target: ctx.other, glow: 1, until };
    case "hook": return { type, at, text: "Texto do gancho", until };
    case "highlight": return { type, at, text: "DESTAQUE", until: shiftRef(at, 1.5) };
    case "bubble": return { type, at, actor: ctx.actor, text: "!", until };
    case "thought": return { type, at, actor: ctx.actor, text: "...", until };
    case "counter": return { type, at, label: "PASSOS:", value: 1 };
    case "card": return { type, at, text: "Texto do card", until };
    case "jump": return { type, at, actor: ctx.actor, height: 14, times: 3, dur: 1.5 };
    case "climb": return { type, at, actor: ctx.actor, height: pos.lift > 4 ? 0 : 72, dur: 1.2 };
    case "place": return { type, at, actor: ctx.actor, x: round(pos.x), z: round(pos.z) };
    case "murmur": return { type, at, until };
    case "set": return { type, at, set: { kind: "jericho" }, fade: 0.8 };
    case "sound": {
      const loop = ctx.variant !== "fx";
      const s = SOUNDS.find((x) => x.loop === loop) ?? SOUNDS[0];
      return loop ? { type, at, sound: s?.id ?? "", volume: 0.2, until: shiftRef(at, 8) } : { type, at, sound: s?.id ?? "", volume: 0.6 };
    }
  }
}
