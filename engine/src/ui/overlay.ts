// Camada de UI desenhada pixel a pixel na resolução baixa: legenda, balões, contador, gancho.
import type { Bitmap } from "../core/pixels";
import { glyph, textWidth, wrap, LINE_H } from "./font";

type C4 = [number, number, number, number];

export function hex(c: string, a = 255): C4 {
  const n = parseInt(c.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

const INK: C4 = [16, 14, 24, 255];
const PAPER: C4 = [250, 246, 232, 255];

export class Overlay {
  readonly bmp: Bitmap;
  constructor(readonly w: number, readonly h: number) {
    this.bmp = { w, h, data: new Uint8Array(w * h * 4) };
  }

  clear() { this.bmp.data.fill(0); }

  px(x: number, y: number, c: C4) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, d = this.bmp.data, a = c[3] / 255;
    d[i] = d[i] * (1 - a) + c[0] * a;
    d[i + 1] = d[i + 1] * (1 - a) + c[1] * a;
    d[i + 2] = d[i + 2] * (1 - a) + c[2] * a;
    d[i + 3] = Math.max(d[i + 3], c[3]);
  }

  rect(x: number, y: number, w: number, h: number, c: C4) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  /** Texto numa linha. `outline` desenha contorno de 1px (legível em qualquer fundo). */
  text(s: string, x: number, y: number, o: { color?: C4; outline?: C4 | null; scale?: number } = {}) {
    const { color = PAPER, outline = INK, scale = 1 } = o;
    const pts: [number, number][] = [];
    let cx = 0;
    for (const ch of s) {
      const g = glyph(ch);
      for (const [gx, gy] of g.px) pts.push([cx + gx, gy]);
      cx += g.w + 1;
    }
    const dot = (px: number, py: number, c: C4) => this.rect(x + px * scale, y + py * scale, scale, scale, c);
    if (outline)
      for (const [gx, gy] of pts)
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]])
          dot(gx + dx, gy + dy, outline);
    for (const [gx, gy] of pts) dot(gx, gy, color);
  }

  /** Bloco de texto centralizado em `cx`, quebrando em `maxW`. Devolve a altura. */
  block(s: string, cx: number, y: number, maxW: number, o: { color?: C4; outline?: C4 | null; scale?: number; lineGap?: number } = {}) {
    const scale = o.scale ?? 1;
    const lines = wrap(s, maxW, scale);
    const lh = (LINE_H + (o.lineGap ?? 0)) * scale;
    lines.forEach((l, i) => this.text(l, Math.round(cx - textWidth(l, scale) / 2), y + i * lh, o));
    return lines.length * lh;
  }

  /** Legenda estilo TikTok: branca com contorno, centralizada. */
  caption(s: string, y: number, color?: string) {
    this.block(s, this.w / 2, y, this.w - 16, { color: color ? hex(color) : PAPER });
  }

  /** Texto de gancho grande no topo. */
  hook(s: string, y = 28, color = "#ffd84a") {
    this.block(s, this.w / 2, y, this.w - 12, { color: hex(color), scale: 2, lineGap: -2 });
  }

  /** Balão de fala (ou pensamento) apontando pra (tx, ty), normalmente a cabeça do personagem. */
  bubble(s: string, tx: number, ty: number, kind: "speech" | "thought" = "speech") {
    const maxW = 96;
    const lines = wrap(s, maxW);
    const tw = Math.max(...lines.map((l) => textWidth(l)));
    const bw = tw + 8, bh = lines.length * LINE_H + 4;
    const bx = Math.round(Math.min(Math.max(tx - bw / 2, 3), this.w - bw - 3));
    const by = Math.round(Math.max(ty - bh - 12, 3));
    // corpo: retângulo com cantos cortados (pixel art)
    const r = kind === "thought" ? 3 : 1;
    for (let j = 0; j < bh; j++)
      for (let i = 0; i < bw; i++) {
        const cx = Math.min(i, bw - 1 - i), cy = Math.min(j, bh - 1 - j);
        if (cx + cy < r) continue;
        const edge = cx === 0 || cy === 0 || cx + cy === r;
        this.px(bx + i, by + j, edge ? INK : PAPER);
      }
    if (kind === "speech") {
      // rabinho em escada até o alvo
      const sx = Math.round(Math.min(Math.max(tx, bx + 4), bx + bw - 5));
      for (let k = 0; k < 6; k++) {
        const y = by + bh - 1 + k, x = sx + Math.round((tx - sx) * (k / 6));
        this.px(x - 1, y, INK); this.px(x, y, k < 5 ? PAPER : INK); this.px(x + 1, y, INK);
        if (k === 0) this.px(x, y, PAPER);
      }
    } else {
      // bolinhas de pensamento
      const steps: [number, number][] = [[0.35, 2], [0.7, 1]];
      for (const [f, rad] of steps) {
        const x = bx + bw / 2 + (tx - bx - bw / 2) * f, y = by + bh + (ty - by - bh) * f;
        for (let j = -rad; j <= rad; j++)
          for (let i = -rad; i <= rad; i++) {
            const d = Math.hypot(i, j);
            if (d <= rad + 0.3) this.px(x + i, y + j, d > rad - 0.7 ? INK : PAPER);
          }
      }
    }
    lines.forEach((l, i) =>
      this.text(l, bx + Math.round((bw - textWidth(l)) / 2), by + 2 + i * LINE_H - 1, { color: INK, outline: null }));
  }

  /** Cartão de tela cheia: escurece a cena e mostra o texto grande no meio. */
  card(s: string, color = "#ffffff", fade = 1) {
    this.rect(0, 0, this.w, this.h, [8, 8, 16, Math.round(200 * fade)]);
    if (fade < 0.5) return;
    const scale = wrap(s, this.w - 20, 2).length <= 6 ? 2 : 1;
    const lh = (LINE_H - 1) * scale;
    const lines = wrap(s, this.w - 20, scale);
    const y = Math.round(this.h * 0.42 - (lines.length * lh) / 2);
    this.block(s, this.w / 2, y, this.w - 20, { color: hex(color), scale, lineGap: -1 });
  }

  /** Contador/progresso: "PASSOS: 3" ou barrinha "3/6". */
  counter(label: string, value: number, total?: number, y = 64, color = "#ffd84a") {
    const s = total ? `${label} ${value}/${total}` : `${label} ${value}`;
    const w = textWidth(s) + 8;
    const x = Math.round((this.w - w) / 2);
    this.rect(x, y, w, LINE_H + 2, [16, 14, 24, 200]);
    this.text(s, x + 4, y + 1, { color: hex(color), outline: null });
    if (total) {
      const bw = w - 8;
      this.rect(x + 4, y + LINE_H + 3, bw, 2, [60, 56, 70, 220]);
      this.rect(x + 4, y + LINE_H + 3, Math.round((bw * value) / total), 2, hex(color));
    }
  }
}
