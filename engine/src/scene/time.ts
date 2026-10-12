// Formato curto de tempo (TimeRef em texto), pra escrever cena à mão sem sofrer:
//   "12.5"              → 12,5 s fixos
//   "08-jesus"          → início da voz da fala 08-jesus
//   "08-jesus:end"      → fim da voz
//   "08-jesus+0.3"      → 0,3 s depois do início
//   "10-pedro:end-1.3"  → 1,3 s antes do fim
// Também aceita o formato longo { line, at, offset } e número puro.
import type { TimeRef } from "./types.ts";

export interface RefParts { line: string; at: "start" | "end"; offset: number }

const SHORT = /^(.+?)(?::(start|end|inicio|início|fim))?(?:([+-])(\d+(?:\.\d+)?))?$/;

/**
 * Lê qualquer TimeRef. `isLine` (opcional) resolve ambiguidade de id com número no fim
 * (ex.: fala "parte-2" vs. "parte" menos 2 s). Devolve null se o texto não faz sentido.
 */
export function parseRef(ref: TimeRef, isLine?: (id: string) => boolean): number | RefParts | null {
  if (typeof ref === "number") return ref;
  if (typeof ref === "object") return { line: ref.line, at: ref.at ?? "start", offset: ref.offset ?? 0 };
  const s = ref.trim();
  if (/^\d+(\.\d+)?$/.test(s)) return +s;
  if (isLine?.(s)) return { line: s, at: "start", offset: 0 };
  const m = SHORT.exec(s);
  if (!m) return null;
  const at = m[2] === "end" || m[2] === "fim" ? "end" : "start";
  const offset = m[4] ? (m[3] === "-" ? -1 : 1) * +m[4] : 0;
  if (isLine && !isLine(m[1])) return null;
  return { line: m[1], at, offset };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Escreve no formato curto. */
export function formatRef(p: RefParts): string {
  const off = r2(p.offset);
  return `${p.line}${p.at === "end" ? ":end" : ""}${off ? (off > 0 ? `+${off}` : `${off}`) : ""}`;
}

/** Monta um TimeRef no mesmo estilo de `like` (texto continua texto, objeto continua objeto). */
export function sameStyle(like: TimeRef | undefined, p: number | RefParts): TimeRef {
  if (typeof p === "number") return r2(p);
  if (like !== undefined && typeof like === "object") {
    const o: { line: string; at?: "end"; offset?: number } = { line: p.line };
    if (p.at === "end") o.at = "end";
    if (r2(p.offset)) o.offset = r2(p.offset);
    return o;
  }
  return formatRef(p);
}

/** Move `delta` segundos mantendo a âncora e o estilo. */
export function shiftRef(ref: TimeRef, delta: number): TimeRef {
  const p = parseRef(ref);
  if (p === null) return ref;
  if (typeof p === "number") return r2(Math.max(0, p + delta));
  return sameStyle(ref, { ...p, offset: p.offset + delta });
}
