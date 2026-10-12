// Tudo que o editor sabe sobre cada tipo de cue: em que trilha fica, nome, cor e campos do inspetor.
import type { Build, Cue, CueType, Scene, TimeRef } from "../../engine/src/scene/types.ts";
import type { Timeline } from "../../engine/src/scene/timeline";
import { formatRef, shiftRef } from "../../engine/src/scene/time.ts";

export type Track = "camera" | "clima" | "acoes" | "tela";

export type Field =
  | { key: string; label: string; kind: "number"; min: number; max: number; step: number; optional?: boolean; hint?: string }
  | { key: string; label: string; kind: "text"; long?: boolean }
  | { key: string; label: string; kind: "actor"; optional?: boolean }
  | { key: string; label: string; kind: "select"; options: [string | number, string][]; optional?: boolean }
  | { key: string; label: string; kind: "color"; optional?: boolean }
  | { key: string; label: string; kind: "until" };

interface Meta { label: string; track: Track; color: string; fields: Field[] }

const W = (key: string, label: string): Field => ({ key, label, kind: "number", min: 0, max: 1, step: 0.05, optional: true });

export const CUE_META: Record<CueType, Meta> = {
  camera: {
    label: "Câmera", track: "camera", color: "#6fb6ff", fields: [
      { key: "actor", label: "Enquadrar", kind: "actor", optional: true },
      { key: "shot", label: "Plano", kind: "select", optional: true, options: [["close", "Close no rosto"], ["medium", "Plano médio"], ["wide", "Plano geral"]] },
      { key: "dur", label: "Transição (s)", kind: "number", min: 0, max: 5, step: 0.1, hint: "0 = corte seco" },
      { key: "x", label: "Centro X", kind: "number", min: -60, max: 260, step: 1, optional: true },
      { key: "y", label: "Centro Y", kind: "number", min: 60, max: 320, step: 1, optional: true },
      { key: "zoom", label: "Zoom", kind: "number", min: 0.8, max: 4, step: 0.05, optional: true },
    ],
  },
  shake: {
    label: "Tremor", track: "camera", color: "#ff9d6f", fields: [
      { key: "amp", label: "Intensidade (px)", kind: "number", min: 0.5, max: 10, step: 0.5 },
      { key: "dur", label: "Duração (s)", kind: "number", min: 0.1, max: 4, step: 0.1 },
    ],
  },
  weather: {
    label: "Clima", track: "clima", color: "#9fd4c8", fields: [
      { key: "dur", label: "Transição (s)", kind: "number", min: 0, max: 10, step: 0.1 },
      W("rain", "Chuva"), W("wind", "Vento"), W("fog", "Neblina"), W("lightning", "Relâmpagos automáticos"),
      W("daylight", "Hora (0 noite → 1 amanhecer)"), W("waves", "Ondas"), W("swell", "Onda gigante"),
    ],
  },
  lightning: {
    label: "Relâmpago", track: "clima", color: "#e8f0ff", fields: [
      { key: "strength", label: "Força", kind: "number", min: 0.2, max: 1.5, step: 0.05 },
    ],
  },
  walk: {
    label: "Andar", track: "acoes", color: "#c8b06f", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "x", label: "Até X", kind: "number", min: -60, max: 300, step: 1 },
      { key: "z", label: "Até profundidade", kind: "number", min: -40, max: 120, step: 1, optional: true },
      { key: "speed", label: "Velocidade (px/s)", kind: "number", min: 2, max: 120, step: 1 },
      { key: "hop", label: "Pulo (descer/subir no barco)", kind: "number", min: 0, max: 24, step: 1, optional: true },
    ],
  },
  face: {
    label: "Virar", track: "acoes", color: "#b9a57a", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "dir", label: "Olhar para", kind: "select", options: [[1, "Direita"], [-1, "Esquerda"]] },
    ],
  },
  sink: {
    label: "Afundar", track: "acoes", color: "#5f8fd0", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "depth", label: "Profundidade (px, 0 = sobe)", kind: "number", min: 0, max: 44, step: 1 },
      { key: "dur", label: "Duração (s)", kind: "number", min: 0.1, max: 5, step: 0.1 },
    ],
  },
  reach: {
    label: "Estender a mão", track: "acoes", color: "#e0b0ff", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  gesture: {
    label: "Gesto", track: "acoes", color: "#d0a0e0", fields: [
      { key: "actor", label: "Quem", kind: "actor" },
      { key: "variant", label: "Gesto", kind: "select", options: [["reach", "Braço esticado"]] },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  hold: {
    label: "Segurar a mão", track: "acoes", color: "#ffcf7a", fields: [
      { key: "actor", label: "Quem segura", kind: "actor" },
      { key: "target", label: "Quem é segurado", kind: "actor" },
      { key: "glow", label: "Brilho quente nas mãos", kind: "number", min: 0, max: 2, step: 0.05 },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  hook: {
    label: "Texto-gancho", track: "tela", color: "#ffd84a", fields: [
      { key: "text", label: "Texto", kind: "text", long: true },
      { key: "color", label: "Cor", kind: "color", optional: true },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  bubble: {
    label: "Balão de fala", track: "tela", color: "#f4f0e4", fields: [
      { key: "actor", label: "De quem", kind: "actor" },
      { key: "text", label: "Texto", kind: "text" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  thought: {
    label: "Balão de pensamento", track: "tela", color: "#d8d4ff", fields: [
      { key: "actor", label: "De quem", kind: "actor" },
      { key: "text", label: "Texto", kind: "text" },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  counter: {
    label: "Contador", track: "tela", color: "#ffe28a", fields: [
      { key: "label", label: "Rótulo", kind: "text" },
      { key: "value", label: "Valor", kind: "number", min: 0, max: 99, step: 1 },
      { key: "total", label: "Total (barrinha)", kind: "number", min: 1, max: 99, step: 1, optional: true },
      { key: "color", label: "Cor (azul = congelado)", kind: "color", optional: true },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
  card: {
    label: "Card final", track: "tela", color: "#ffffff", fields: [
      { key: "text", label: "Texto", kind: "text", long: true },
      { key: "color", label: "Cor", kind: "color", optional: true },
      { key: "until", label: "Até", kind: "until" },
    ],
  },
};

export const TRACKS: { id: Track; label: string }[] = [
  { id: "camera", label: "Câmera" },
  { id: "clima", label: "Clima" },
  { id: "acoes", label: "Ações" },
  { id: "tela", label: "Tela" },
];

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
export function summary(c: Cue, scene: Scene): string {
  const who = (id?: string) => (id ? scene.actors[id]?.name ?? id : "");
  switch (c.type) {
    case "camera": return c.shot ? `${{ close: "Close", medium: "Médio", wide: "Geral" }[c.shot]} ${who(c.actor)}`.trim() : `zoom ${c.zoom ?? "–"}`;
    case "shake": return `tremor ${c.amp ?? 3}`;
    case "weather": return Object.entries(c).filter(([k]) => ["rain", "wind", "fog", "lightning", "daylight", "waves", "swell"].includes(k)).map(([k, v]) => `${k} ${v}`).join(" · ");
    case "lightning": return "⚡";
    case "walk": return `${who(c.actor)} → ${c.x}${c.hop ? " (pulo)" : ""}`;
    case "face": return `${who(c.actor)} ${c.dir > 0 ? "→" : "←"}`;
    case "sink": return `${who(c.actor)} ↓${c.depth}`;
    case "reach": case "gesture": return `${who(c.actor)} ✋`;
    case "hold": return `${who(c.actor)} ✋ ${who(c.target)}`;
    case "hook": case "card": return c.text;
    case "bubble": case "thought": return `${who(c.actor)}: ${c.text}`;
    case "counter": return `${c.label} ${c.value}`;
  }
}

/** Cue novo com valores bons, no tempo t. */
export function makeCue(type: CueType, at: TimeRef, ctx: { actor: string; other: string; t: number; tl: Timeline }): Cue {
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
    case "gesture": return { type, at, actor: ctx.actor, variant: "reach", until };
    case "hold": return { type, at, actor: ctx.actor, target: ctx.other, glow: 1, until };
    case "hook": return { type, at, text: "Texto do gancho", until };
    case "bubble": return { type, at, actor: ctx.actor, text: "!", until };
    case "thought": return { type, at, actor: ctx.actor, text: "...", until };
    case "counter": return { type, at, label: "PASSOS:", value: 1 };
    case "card": return { type, at, text: "Texto do card", until };
  }
}
