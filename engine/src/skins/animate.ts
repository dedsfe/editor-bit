// Animação genérica: qualquer skin vira um grid por pose (respirar, piscar, falar, andar).
import type { Skin } from "./types";
import type { Grid } from "../core/pixels";

export type FeetPose = "stand" | "step" | "pass";

/** Gestos que toda skin tem sem precisar desenhar variante. */
export const BUILTIN_GESTURES = ["lookup"];

export interface Pose {
  breathe: 0 | 1;
  blink: boolean;
  mouth: 0 | 1 | 2;
  feet: FeetPose;
  bob: number;    // corpo sobe N px no passo
  propDx: number; // cajado vai pra frente/trás
  /** gesto da skin (ex.: "reach"); sem gesto = camadas normais */
  variant?: string;
}

export const REST: Pose = { breathe: 0, blink: false, mouth: 0, feet: "stand", bob: 0, propDx: 0 };

export const poseKey = (p: Pose) => `${p.breathe}${+p.blink}${p.mouth}${p.feet}${p.bob}${p.propDx}${p.variant ?? ""}`;

export function composeSkin(s: Skin, p: Pose): Grid {
  const feetRows = s.feet.stand.length;
  const g: string[][] = Array.from({ length: s.h }, () => Array(s.w).fill("."));
  const put = (x: number, y: number, c: string) => {
    if (c !== "." && x >= 0 && x < s.w && y >= 0 && y < s.h) g[y][x] = c;
  };
  const extra = p.variant ? s.poses?.[p.variant] : undefined;
  const headDy = p.breathe - p.bob + (extra?.dy ?? 0);
  const offset = (f: string): [number, number] =>
    f === "head" ? [0, headDy] : f === "body" ? [0, -p.bob] : f === "prop" ? [p.propDx, -p.bob] : [0, 0];

  let parts = s.parts;
  const swap = p.variant ? s.variants?.[p.variant] : undefined;
  if (swap) {
    parts = parts.map((part) => swap.find((v) => v.name === part.name) ?? part);
    parts = [...parts, ...swap.filter((v) => !s.parts.some((part) => part.name === v.name))];
  }
  for (const part of parts) {
    const [dx, dy] = offset(part.follows);
    part.grid.forEach((row, y) => [...row].forEach((c, x) => put(part.at[0] + x + dx, part.at[1] + y + dy, c)));
  }
  if (p.variant === "lookup") {
    // olhar pra cima: a pupila sobe 1 px (vale pra qualquer skin, sem desenho extra)
    for (const [x, y] of s.eyes.pixels) {
      const yy = y + headDy, eye = g[yy]?.[x];
      if (!eye || eye === "." || g[yy - 1]?.[x] === ".") continue;
      put(x, yy, s.eyes.lid);
      put(x, yy - 1, eye);
    }
  }
  const lid = extra?.eyesClosed ? s.eyes.closed ?? s.eyes.lid : s.eyes.lid;
  if (p.blink || extra?.eyesClosed) for (const [x, y] of s.eyes.pixels) if (g[y + headDy]?.[x] !== ".") put(x, y + headDy, lid);
  const mouth = p.mouth === 2 ? s.mouth.open : p.mouth === 1 ? s.mouth.half : [];
  for (const [x, y] of mouth) put(x, y + headDy, s.mouth.color);
  if (!swap?.some((v) => v.name === "pés")) s.feet[p.feet].forEach((row, i) => [...row].forEach((c, x) => put(x, s.h - feetRows + i, c)));
  return g.map((r) => r.join(""));
}
