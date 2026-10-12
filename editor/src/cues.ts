// Tudo que o editor sabe sobre cada tipo de cue: em que trilha fica, nome, cor e campos do inspetor.
import type { Build, Cue, CueType, Scene, TimeRef } from "../../engine/src/scene/types.ts";
import type { Timeline } from "../../engine/src/scene/timeline";
import { formatRef, shiftRef } from "../../engine/src/scene/time.ts";

export type Track = "camera" | "cena" | "acoes" | "tela";

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
      { key: "variant", label: "Gesto", kind: "select", options: [["reach", "Braço esticado / apontar"], ["lookup", "Olhar pra cima"]] },
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
    id: "camera", label: "Câmera", color: "#7aa7ff", add: [
      { kind: "shot", shot: "close", label: "Close no rosto", actor: true },
      { kind: "shot", shot: "medium", label: "Plano médio", actor: true },
      { kind: "shot", shot: "wide", label: "Plano geral" },
      { kind: "follow", label: "Seguir quem fala", hint: "um enquadramento por fala, automático" },
      { kind: "cue", type: "shake", label: "Tremor" },
    ],
  },
  {
    id: "cena", label: "Cena", color: "#5fc9b5", add: [
      { kind: "cue", type: "set", label: "Trocar cenário" },
      { kind: "cue", type: "weather", label: "Clima e hora do dia", hint: "chuva, vento, neblina, ondas, amanhecer" },
      { kind: "cue", type: "lightning", label: "Relâmpago" },
      { kind: "cue", type: "murmur", label: "Multidão cochicha" },
    ],
  },
  {
    id: "acoes", label: "Ações", color: "#e0b25a", add: [
      { kind: "cue", type: "walk", label: "Andar", actor: true },
      { kind: "cue", type: "jump", label: "Pular", actor: true },
      { kind: "cue", type: "climb", label: "Subir / descer / cair", actor: true },
      { kind: "cue", type: "sink", label: "Afundar", actor: true },
      { kind: "cue", type: "reach", label: "Estender a mão", actor: true },
      { kind: "cue", type: "hold", label: "Segurar a mão", actor: true, hint: "brilho quente nas mãos" },
      { kind: "cue", type: "gesture", variant: "lookup", label: "Olhar pra cima", actor: true },
      { kind: "cue", type: "face", label: "Virar", actor: true },
      { kind: "cue", type: "place", label: "Posicionar / esconder", actor: true },
    ],
  },
  {
    id: "tela", label: "Tela", color: "#e58fd0", add: [
      { kind: "cue", type: "hook", label: "Texto-gancho" },
      { kind: "cue", type: "bubble", label: "Balão de fala", actor: true },
      { kind: "cue", type: "thought", label: "Balão de pensamento", actor: true },
      { kind: "cue", type: "counter", label: "Contador" },
      { kind: "cue", type: "card", label: "Card final" },
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
    case "hook": case "card": return c.text;
    case "bubble": case "thought": return `${who(c.actor)}: ${c.text}`;
    case "counter": return `${c.label} ${c.value}`;
    case "jump": return `${who(c.actor)} pula ×${c.times ?? 3}`;
    case "climb": return `${who(c.actor)} ${c.fall ? "cai" : c.height > 0 ? `sobe ${c.height}` : "desce"}`;
    case "place": return `${who(c.actor)}${c.hidden ? " (esconde)" : c.hidden === false ? " (aparece)" : ` → ${c.x ?? ""}`}`;
    case "murmur": return "cochicho";
    case "set": return `→ ${c.set.kind}`;
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
    case "bubble": return { type, at, actor: ctx.actor, text: "!", until };
    case "thought": return { type, at, actor: ctx.actor, text: "...", until };
    case "counter": return { type, at, label: "PASSOS:", value: 1 };
    case "card": return { type, at, text: "Texto do card", until };
    case "jump": return { type, at, actor: ctx.actor, height: 14, times: 3, dur: 1.5 };
    case "climb": return { type, at, actor: ctx.actor, height: pos.lift > 4 ? 0 : 72, dur: 1.2 };
    case "place": return { type, at, actor: ctx.actor, x: round(pos.x), z: round(pos.z) };
    case "murmur": return { type, at, until };
    case "set": return { type, at, set: { kind: "jericho" }, fade: 0.8 };
  }
}
