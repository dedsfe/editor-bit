// Estado da cena num tempo t: tudo é função pura de t (scrub e export dão o mesmo frame).
import type { Scene, Build, TimeRef, Cue, Weather, CameraShot } from "./types";
import type { Pose, FeetPose } from "../skins/animate";
import { hash } from "../core/noise";
import { wrap } from "../ui/font";
import { parseRef } from "./time.ts";

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const WALK: [FeetPose, number, number][] = [["step", 0, 1], ["pass", 1, 0], ["step", 0, -1], ["pass", 1, 0]];

export interface ActorState {
  x: number; z: number; facing: 1 | -1; pose: Pose; talking: boolean;
  /** px acima do chão (pulo) */
  lift: number;
  /** px afundado (água) */
  sink: number;
  /** escondido (ex.: não está nesta cena) */
  hidden: boolean;
}

export interface HoldState { actor: string; target: string; k: number; glow: number }

export const SPANS = ["hook", "bubble", "thought", "counter", "gesture", "reach", "hold", "card", "murmur"];

/** Clima em t + o brilho do relâmpago (0..1) e quando caíram os raios ativos. */
export type Env = Partial<Weather> & { flash: number; strikes: number[] };

/** Enquadramentos prontos: quanto de zoom e onde fica o centro em relação ao pé do personagem. */
export const SHOTS: Record<CameraShot, { zoom: number; up: number }> = {
  close: { zoom: 2.6, up: 0.78 },
  medium: { zoom: 1.8, up: 0.5 },
  wide: { zoom: 1.25, up: 0.62 },
};

/** Onde está o personagem na tela (antes da câmera): pé e altura. Quem sabe isso é o Player. */
export type Framer = (actor: string, t: number) => { x: number; footY: number; h: number } | null;

/** Relâmpago: pisca forte, apaga, pisca de novo e some. */
export function flashEnv(d: number) {
  if (d < 0) return 0;
  if (d < 0.06) return 1;
  if (d < 0.13) return 0.2;
  if (d < 0.2) return 0.85;
  return Math.exp(-(d - 0.2) * 7) * 0.85;
}

const WEATHER_KEYS = ["rain", "wind", "fog", "lightning", "daylight", "waves", "swell"] as const;

interface Resolved { c: Cue; t: number; t1: number }

export class Timeline {
  private resolved: Resolved[];

  constructor(readonly scene: Scene, readonly build: Build) {
    const cues = scene.cues ?? [];
    const base = cues.map((c) => ({ c, t: this.time(c.at) })).filter((r) => Number.isFinite(r.t));
    this.resolved = base
      .map(({ c, t }) => {
        let t1 = t;
        if (SPANS.includes(c.type)) {
          const u = (c as { until?: TimeRef }).until;
          // sem `until`: fica até o próximo do mesmo tipo (contador, card) ou até o fim
          const next = base.filter((o) => o.c.type === c.type && o.c !== c && o.t > t).map((o) => o.t);
          t1 = u !== undefined ? this.time(u) : next.length ? Math.min(...next) : this.duration;
        }
        return { c, t, t1 };
      })
      .sort((a, b) => a.t - b.t);
  }

  get duration() { return this.build.duration; }

  /** Segundos de um TimeRef. Fala que não existe → NaN (o cue fica desligado em vez de quebrar). */
  time(ref: TimeRef): number {
    const p = parseRef(ref, (id) => this.build.lines.some((l) => l.id === id));
    if (p === null) return NaN;
    if (typeof p === "number") return p;
    const l = this.build.lines.find((l) => l.id === p.line)!;
    return (p.at === "end" ? l.voiceEnd : l.voiceStart) + p.offset;
  }

  /** Início e fim (s) de um cue já resolvidos. */
  span(c: Cue): { t: number; t1: number } {
    const r = this.resolved.find((r) => r.c === c);
    return r ? { t: r.t, t1: r.t1 } : { t: NaN, t1: NaN };
  }

  private cues<T extends Cue["type"]>(type: T) {
    return this.resolved.filter((r) => r.c.type === type) as { c: Extract<Cue, { type: T }>; t: number; t1: number }[];
  }

  actor(id: string, t: number): ActorState {
    const def = this.scene.actors[id];
    let x = def.x, z = def.z, facing: 1 | -1 = def.facing ?? 1, walking = false, walkT = 0, lift = 0, hidden = false;
    // deslocamentos em ordem: andar parte de onde parou; "place" teletransporta; "climb" com x anda subindo
    const moves = this.resolved.filter((r) => (r.c.type === "walk" || r.c.type === "place" || (r.c.type === "climb" && r.c.x !== undefined))
      && (r.c as { actor: string }).actor === id);
    for (const { c, t: t0 } of moves) {
      if (t < t0) break;
      if (c.type === "place") {
        x = c.x ?? x; z = c.z ?? z;
        if (c.facing) facing = c.facing;
        if (c.hidden !== undefined) hidden = c.hidden;
        continue;
      }
      const tx = (c as { x: number }).x, tz = c.type === "walk" ? c.z ?? z : z;
      const dur = c.type === "walk" ? Math.hypot(tx - x, tz - z) / (c.speed ?? 24) : (c as { dur?: number }).dur ?? 1.2;
      if (tx !== x) facing = tx > x ? 1 : -1;
      if (t < t0 + dur) {
        const k = (t - t0) / dur;
        x += (tx - x) * k; z += (tz - z) * k;
        walking = c.type === "walk"; walkT = t - t0;
        if (c.type === "walk" && c.hop) lift = Math.sin(Math.PI * k) * c.hop;
        break;
      }
      x = tx; z = tz;
    }
    for (const { c, t: t0 } of this.cues("face")) if (c.actor === id && t >= t0) facing = c.dir;

    // subir/descer/cair: fica a `height` px do chão; cair = gravidade + quique no fim
    let perch = 0, climbing = false, fallen = -1;
    for (const { c, t: t0 } of this.cues("climb")) {
      if (c.actor !== id || t < t0) continue;
      const dur = c.dur ?? (c.fall ? 0.45 : 1.2), k = (t - t0) / dur;
      const from = perch;
      if (k < 1) {
        perch = from + (c.height - from) * (c.fall ? k * k : ease(k));
        climbing = !c.fall;
        fallen = -1;
        break;
      }
      perch = c.height;
      if (c.fall) fallen = t - t0 - dur;
    }
    if (fallen >= 0 && fallen < 0.35) perch += Math.abs(Math.sin((fallen / 0.35) * Math.PI)) * 4 * (1 - fallen / 0.35);
    lift += perch;
    // pular no lugar
    for (const { c, t: t0 } of this.cues("jump")) {
      if (c.actor !== id) continue;
      const dur = c.dur ?? 1.5, k = (t - t0) / dur;
      if (k < 0 || k >= 1) continue;
      lift += Math.abs(Math.sin(Math.PI * k * (c.times ?? 3))) * (c.height ?? 10);
      walking = walking || Math.abs(Math.sin(Math.PI * k * (c.times ?? 3))) > 0.15;
    }

    const seed = hash(...[...id].map((ch) => ch.charCodeAt(0))) * 10;
    const pose: Pose = { breathe: 0, blink: false, mouth: 0, feet: "stand", bob: 0, propDx: 0 };
    if (walking || climbing) {
      const [feet, bob, propDx] = WALK[Math.floor((walkT || t) * (climbing ? 9 : 7)) % 4];
      Object.assign(pose, { feet, bob, propDx });
    } else {
      pose.breathe = (Math.floor((t + seed) / 0.7) % 2) as 0 | 1;
    }
    const k = Math.floor((t + seed) / 3.4);
    const blinkAt = k * 3.4 + hash(k, seed) * 2;
    pose.blink = t + seed >= blinkAt && t + seed < blinkAt + 0.13;

    // afundar: cada sink parte da profundidade em que o anterior estava; segurar puxa pra cima
    const sinks = [
      ...this.cues("sink").filter(({ c }) => c.actor === id).map(({ c, t }) => ({ t, depth: c.depth, dur: c.dur ?? 1 })),
      ...this.cues("hold").filter(({ c }) => c.target === id).map(({ t }) => ({ t, depth: 0, dur: 0.9 })),
    ].sort((a, b) => a.t - b.t);
    let sink = 0;
    for (const s of sinks) {
      if (t < s.t) break;
      sink += (s.depth - sink) * ease((t - s.t) / s.dur);
    }

    // gestos ativos (o último que começou ganha)
    for (const c of this.active(t)) {
      if (c.type === "gesture" && c.actor === id) pose.variant = c.variant;
      if (c.type === "reach" && c.actor === id) pose.variant = "reach";
      if (c.type === "hold" && (c.actor === id || c.target === id)) pose.variant = "reach";
    }

    // multidão cochichando: figurantes mexem a boca à toa
    if (def.extra && this.active(t).some((c) => c.type === "murmur")) {
      const f = Math.floor(t * 8 + seed * 13);
      pose.mouth = (hash(f, seed * 100) < 0.45 ? 0 : hash(f, 3) < 0.6 ? 1 : 2) as 0 | 1 | 2;
    }

    let talking = false;
    for (const l of this.build.lines) {
      if (l.speaker !== id) continue;
      const f = Math.floor((t - l.clipStart) * this.build.fps);
      if (f >= 0 && f < l.mouth.length) {
        pose.mouth = l.mouth[f] as 0 | 1 | 2;
        talking = t >= l.voiceStart && t <= l.voiceEnd;
      }
    }
    return { x, z, facing, pose, talking, lift, sink, hidden };
  }

  /**
   * Câmera em t. Keyframes com x/y/zoom fixos ou com enquadramento de personagem (segue ele andando).
   * `frame` diz onde cada personagem está; sem ele, enquadramentos de personagem são ignorados.
   */
  camera(t: number, frame?: Framer) {
    const home = this.scene.camera ?? { x: 90, y: 160, zoom: 1 };
    const cam = { ...home };
    for (const { c, t: t0 } of this.cues("camera")) {
      if (t < t0) break;
      const k = ease(c.dur ? (t - t0) / c.dur : 1);
      let target: { x?: number; y?: number; zoom?: number } = c;
      if (c.shot) {
        const f = c.actor && frame ? frame(c.actor, t) : null;
        const s = SHOTS[c.shot];
        target = f ? { x: f.x, y: f.footY - f.h * s.up, zoom: c.zoom ?? s.zoom } : c.shot === "wide" ? home : {};
      }
      if (target.x !== undefined) cam.x += (target.x - cam.x) * k;
      if (target.y !== undefined) cam.y += (target.y - cam.y) * k;
      if (target.zoom !== undefined) cam.zoom += (target.zoom - cam.zoom) * k;
    }
    for (const { c, t: t0 } of this.cues("shake")) {
      const dur = c.dur ?? 0.4, k = (t - t0) / dur;
      if (k < 0 || k > 1) continue;
      const amp = (c.amp ?? 3) * (1 - k), f = Math.floor(t * 30);
      cam.x += Math.round((hash(f, 1) - 0.5) * 2 * amp);
      cam.y += Math.round((hash(f, 2) - 0.5) * 2 * amp);
    }
    return cam;
  }

  /** Cues com duração ativos em t (gancho, balões, contador, gestos, cards). */
  active(t: number) {
    return this.resolved
      .filter((r) => SPANS.includes(r.c.type) && t >= r.t && t < r.t1)
      .map((r) => r.c as Extract<Cue, { until?: TimeRef }>);
  }

  /** Cenário ativo em t e quanto de preto (0..1) por causa do fade da troca. */
  setAt(t: number): { set: Scene["set"]; fade: number } {
    let set = this.scene.set, fade = 0;
    for (const { c, t: t0 } of this.cues("set")) {
      const half = (c.fade ?? 0.6) / 2;
      if (half > 0 && Math.abs(t - t0) < half) fade = Math.max(fade, 1 - Math.abs(t - t0) / half);
      if (t >= t0) set = c.set;
    }
    return { set, fade };
  }

  /** Clima em t: começa em scene.weather e cada cue "weather" vai até os valores dele em `dur`. */
  env(t: number): Env {
    const w: Partial<Weather> = { ...this.scene.weather };
    for (const { c, t: t0 } of this.cues("weather")) {
      if (t < t0) break;
      const k = ease(c.dur ? (t - t0) / c.dur : 1);
      for (const key of WEATHER_KEYS) {
        const v = c[key];
        if (v !== undefined) w[key] = (w[key] ?? 0) + (v - (w[key] ?? 0)) * k;
      }
    }
    // raios: os marcados + automáticos (no máximo 1 a cada ~5,5 s, mais frequentes com lightning alto)
    const strikes: { t: number; s: number }[] = this.cues("lightning")
      .filter(({ t: t0 }) => t >= t0 && t - t0 < 1.5)
      .map(({ c, t: t0 }) => ({ t: t0, s: c.strength ?? 1 }));
    for (const k of [Math.floor(t / 5.5) - 1, Math.floor(t / 5.5)]) {
      const ts = k * 5.5 + hash(k, 77) * 4;
      if (t < ts || t - ts > 1.5) continue;
      const rate = this.envAt("lightning", ts);
      if (hash(k, 78) < rate * 0.55) strikes.push({ t: ts, s: 1 });
    }
    const flash = Math.max(0, ...strikes.map((s) => flashEnv(t - s.t) * s.s));
    return { ...w, flash, strikes: strikes.map((s) => s.t) };
  }

  private envAt(key: (typeof WEATHER_KEYS)[number], t: number) {
    let v = this.scene.weather?.[key] ?? 0;
    for (const { c, t: t0 } of this.cues("weather")) {
      if (t < t0) break;
      const target = c[key];
      if (target !== undefined) v += (target - v) * ease(c.dur ? (t - t0) / c.dur : 1);
    }
    return v;
  }

  /** Quem está segurando quem em t (k = 0..1 de entrada do brilho). */
  holds(t: number): HoldState[] {
    return this.active(t)
      .filter((c): c is Extract<Cue, { type: "hold" }> => c.type === "hold")
      .map((c) => ({ actor: c.actor, target: c.target, k: ease((t - this.span(c).t) / 0.6), glow: c.glow ?? 1 }));
  }

  /** Legenda em t: páginas de até 2 linhas, tempo dividido pelo tamanho do texto. */
  caption(t: number, maxW: number): { text: string; speaker: string } | null {
    const lines = this.scene.lines;
    for (let i = 0; i < this.build.lines.length; i++) {
      const b = this.build.lines[i], def = lines.find((l) => l.id === b.id)!;
      if (def.caption === false) continue;
      const next = this.build.lines[i + 1];
      const end = Math.min(b.voiceEnd + 0.35, next ? next.voiceStart : Infinity);
      if (t < b.voiceStart || t >= end) continue;
      const pages = paginate(def.text, maxW);
      const k = (t - b.voiceStart) / Math.max(b.voiceEnd - b.voiceStart, 0.01);
      // com transcrição (Whisper) e mesmo número de palavras: a página vira quando a palavra é dita
      const words = def.words;
      const nWords = def.text.split(/\s+/).filter(Boolean).length;
      if (words && words.length === nWords && pages.length > 1) {
        const w0 = words[0].t0, w1 = words[words.length - 1].t1;
        let idx = 0;
        for (const [pi, p] of pages.entries()) {
          idx += p.split(/\s+/).filter(Boolean).length;
          const next = words[idx];
          if (!next || pi === pages.length - 1) return { text: p, speaker: b.speaker };
          const at = (next.t0 - w0) / Math.max(w1 - w0, 0.01);
          if (k < at) return { text: p, speaker: b.speaker };
        }
      }
      const total = pages.reduce((s, p) => s + p.length, 0);
      let acc = 0;
      for (const p of pages) {
        acc += p.length / total;
        if (k < acc) return { text: p, speaker: b.speaker };
      }
      return { text: pages[pages.length - 1], speaker: b.speaker };
    }
    return null;
  }
}

export { paginate };

/** Divide a fala em páginas de até 2 linhas, com tamanhos parecidos (sem palavra órfã na última). */
function paginate(text: string, maxW: number): string[] {
  const n = Math.ceil(wrap(text, maxW).length / 2);
  if (n <= 1) return [text];
  const words = text.split(/\s+/);
  const target = text.length / n;
  const pages: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    const next = [...cur, w].join(" ");
    const full = wrap(next, maxW).length > 2;
    if (cur.length && (full || (next.length > target * 1.08 && pages.length < n - 1))) {
      pages.push(cur.join(" "));
      cur = [w];
    } else cur.push(w);
  }
  if (cur.length) pages.push(cur.join(" "));
  return pages;
}
