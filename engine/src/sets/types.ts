import type { Renderer, Light, Look } from "../core/renderer";
import type { Bitmap } from "../core/pixels";
import type { TimeRef } from "../scene/types";
import type { Env } from "../scene/timeline";

/** Algo em pé que precisa ser ordenado por profundidade junto com os personagens. */
export interface Drawable { z: number; draw(): void }

export interface SetInstance {
  floorY: number;
  look?: Partial<Look>;
  lights(t: number): Light[];
  /** céu, parallax, chão */
  back(t: number): void;
  /** objetos em pé (fogueira, pedras), ordenados com os atores */
  props(t: number): Drawable[];
  /** partículas e coisas na frente de tudo */
  front(t: number): void;
  /**
   * Onde o pé de quem está em (x, z) pisa: `lift` px acima do chão (convés do barco, onda)
   * e se é água (desenha espuma no pé). Sem isso = chão firme.
   */
  surface?(x: number, z: number, t: number): Surface;
  /** recebe o clima do frame (chamado pelo Player antes de desenhar) */
  setEnv?(env: Env): void;
}

export interface Surface { lift: number; water: boolean }

/** O que o cenário pode perguntar pra cena (ex.: resolver { line: "12-andre" } em segundos). */
export interface SetContext {
  time(ref: TimeRef): number;
  /** desenha o raio no céu: o cenário chama isso entre o céu e o chão */
  sky?(t: number): void;
}

export type SetFactory = (r: Renderer, params: Record<string, unknown>, ctx?: SetContext) => SetInstance;

/** Resolve um parâmetro de tempo do cenário (número ou referência a fala). */
export function timeParam(v: unknown, ctx: SetContext | undefined, fallback: number): number {
  if (typeof v === "number") return v;
  if (ctx && (typeof v === "string" || (v && typeof v === "object" && "line" in v))) return ctx.time(v as TimeRef);
  return fallback;
}

/** Pinta um bitmap pixel a pixel. */
export function paint(w: number, h: number, f: (x: number, y: number) => [number, number, number, number?] | null): Bitmap {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = f(x, y);
      if (c) data.set([c[0], c[1], c[2], c[3] ?? 255], (y * w + x) * 4);
    }
  return { w, h, data };
}
