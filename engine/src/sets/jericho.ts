// Cenário: Jericó de dia. Sol forte, rua de terra, casas de barro, palmeiras e a figueira (sicômoro)
// grande em que dá pra subir. Parâmetros: treeX, treeZ (figueira).
// O galho onde se senta fica em x = treeX + 14, altura 72 (use climb height 72, x treeX+14, z treeZ+1).
import type { SetFactory, Drawable } from "./types";
import { paint } from "./types";
import { hash, fbm2 } from "../core/noise";
import { normalMap, gridToBitmap, type Grid, type Palette } from "../core/pixels";
import type { Light } from "../core/renderer";

const FLOOR_Y = 200;
const HORIZON = FLOOR_Y - 26;
const W0 = -80, WW = 340;

type C = [number, number, number];
const SKY: C[] = [[78, 142, 210], [104, 162, 222], [134, 184, 230], [170, 206, 234], [210, 224, 230]];

/** Desenha um grid procedural (char por pixel). */
const grid = (w: number, h: number, f: (x: number, y: number) => string): Grid =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y)).join(""));

/** Um objeto em pé com normal map automático. */
function sprite(r: Parameters<SetFactory>[0], g: Grid, pal: Palette, normals = { radius: 3, strength: 2, materialEdges: 0.3 }) {
  return { tex: r.texture(gridToBitmap(g, pal)), n: r.texture(normalMap(g, normals)), w: g[0].length, h: g.length };
}

// ---- casas de barro em fileira
const HOUSE_PAL: Palette = {
  a: [206, 172, 124], b: [184, 150, 104], c: [162, 128, 86], r: [222, 196, 150], d: [52, 36, 26], w: [70, 50, 36], p: [104, 70, 40], s: [150, 120, 84],
};
function houses(): Grid {
  const W = WW, H = 84;
  const rows: string[][] = Array.from({ length: H }, () => Array(W).fill("."));
  let x = 0, i = 0;
  while (x < W) {
    const w = 34 + Math.floor(hash(i, 1) * 34), h = 34 + Math.floor(hash(i, 2) * 44), tone = ["a", "b", "c"][Math.floor(hash(i, 3) * 3)];
    const top = H - h;
    for (let y = top; y < H; y++) for (let xx = x; xx < Math.min(W, x + w); xx++) {
      const lx = xx - x, ly = y - top;
      let ch = tone;
      if (ly < 3) ch = "r"; // mureta do terraço
      if (ly === 6 && lx % 7 === 3) ch = "p"; // pontas das vigas
      if (hash(xx >> 1, y >> 1, i) > 0.93) ch = "s"; // reboco gasto
      const door = lx > w / 2 - 5 && lx < w / 2 + 5 && ly > h - 18;
      if (door) ch = Math.hypot(lx - w / 2, ly - (h - 18)) < 5 || ly > h - 15 ? "d" : ch;
      if (ly > 12 && ly < 20 && h > 50 && (lx % 14 === 4 || lx % 14 === 5 || lx % 14 === 6) && lx > 3 && lx < w - 4) ch = "w";
      rows[y][xx] = ch;
    }
    x += w + (hash(i, 4) > 0.6 ? 6 : 0);
    i++;
  }
  return rows.map((r) => r.join(""));
}

// ---- palmeira
const PALM_PAL: Palette = { t: [120, 86, 52], u: [92, 64, 38], g: [70, 120, 56], h: [52, 92, 44], l: [104, 150, 70] };
function palm(): Grid {
  const W = 56, H = 96;
  return grid(W, H, (x, y) => {
    const cx = 28 + Math.round(Math.sin(y * 0.04) * 4);
    if (y > 20 && Math.abs(x - cx) <= 2) return y % 5 === 0 ? "u" : "t";
    // folhas: arcos saindo do topo
    for (let k = 0; k < 7; k++) {
      const ang = (k / 7) * Math.PI * 2 + 0.3, len = 22 + (k % 3) * 3;
      for (let s = 0; s < len; s++) {
        const fx = 28 + Math.cos(ang) * s, fy = 20 + Math.sin(ang) * s * 0.5 + (s * s) / 60;
        if (Math.abs(fx - x) < 1.6 - s / 30 && Math.abs(fy - y) < 1.4) return s % 4 === 0 ? "l" : k % 2 ? "g" : "h";
      }
    }
    return ".";
  });
}

// ---- figueira (sicômoro): tronco + galhos + copa; parte das folhas vai NA FRENTE de quem sobe
const TREE_PAL: Palette = { t: [112, 80, 52], u: [86, 60, 38], v: [134, 100, 66], g: [62, 112, 52], h: [46, 88, 42], l: [96, 146, 66], k: [34, 66, 32] };
const TREE_W = 124, TREE_H = 150;
function tree(front: boolean): Grid {
  const cx = 52; // centro do tronco
  const clumps = [
    [30, 34, 22], [62, 22, 26], [92, 36, 22], [46, 54, 20], [78, 52, 22], [104, 58, 16], [20, 58, 16], [64, 42, 18],
  ];
  const frontClumps = [[58, 76, 10], [80, 80, 10], [70, 70, 8]]; // em volta do galho onde senta (x ≈ cx + 14)
  return grid(TREE_W, TREE_H, (x, y) => {
    const inClump = (list: number[][]) => list.find(([px, py, rr]) => Math.hypot(x - px, (y - py) * 1.15) < rr * (0.85 + fbm2(x / 6, y / 6, 7) * 0.3));
    if (front) {
      const c = inClump(frontClumps);
      if (!c) return ".";
      const n = fbm2(x / 3, y / 3, 11);
      return n > 0.62 ? "l" : n > 0.45 ? "g" : n > 0.38 ? "h" : ".";
    }
    // tronco grosso que abre em galhos
    const bh = TREE_H - y;
    const trunkW = 7 + Math.max(0, 14 - bh) * 0.4 + (bh > 60 ? -2 : 0);
    if (bh < 78 && Math.abs(x - cx - Math.sin(bh * 0.05) * 3) < trunkW) return (x + y) % 7 === 0 ? "u" : x < cx - 2 ? "u" : x > cx + 3 ? "v" : "t";
    // galhos: o da direita é o "banco" do Zaqueu (horizontal, altura ~72)
    const branch = (x0: number, y0: number, x1: number, y1: number, wd: number) => {
      const k = Math.max(0, Math.min(1, ((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / ((x1 - x0) ** 2 + (y1 - y0) ** 2)));
      return Math.hypot(x - (x0 + (x1 - x0) * k), y - (y0 + (y1 - y0) * k)) < wd * (1 - k * 0.5);
    };
    if (branch(cx, TREE_H - 70, cx + 34, TREE_H - 74, 4) || branch(cx, TREE_H - 76, cx - 30, TREE_H - 100, 4) || branch(cx, TREE_H - 78, cx + 18, TREE_H - 112, 4))
      return y % 4 === 0 ? "u" : "t";
    const c = inClump(clumps);
    if (!c) return ".";
    const n = fbm2(x / 3, y / 3, 3);
    if (n < 0.32) return "."; // buracos na copa
    return n > 0.64 ? "l" : n > 0.5 ? "g" : n > 0.4 ? "h" : "k";
  });
}

export const jericho: SetFactory = (r, params) => {
  const TX = (params.treeX as number) ?? 130, TZ = (params.treeZ as number) ?? 24;

  const sky = r.texture(paint(r.w, HORIZON + 8, (x, y) => SKY[Math.min(4, Math.floor((y / (HORIZON + 8)) * 5))]));
  const sun = r.texture(paint(19, 19, (x, y) => (Math.hypot(x - 9, y - 9) <= 9.2 ? [255, 246, 214] : null)));
  const clouds = r.texture(paint(WW, 60, (x, y) => {
    const v = fbm2(x / 30, y / 9, 21) - Math.abs(y - 26) / 70;
    return v > 0.5 ? (v > 0.58 ? [250, 250, 248] : [226, 232, 240]) : null;
  }));
  const ridge = (x: number) => 20 + Math.round(8 * Math.sin(x * 0.02 + 1) + 4 * Math.sin(x * 0.07));
  const hills = r.texture(paint(WW, 46, (x, y) => (y >= ridge(x) ? (y < ridge(x) + 2 ? [196, 170, 128] : [176, 150, 110]) : null)));
  const ground = r.texture(paint(WW, r.h - FLOOR_Y + 40, (x, y) => {
    const n = hash(x, y, 11);
    const rut = Math.abs(((y * 3 + Math.round(Math.sin(x * 0.03) * 2)) % 23) - 11) < 1; // marcas de roda
    if (n > 0.965) return [150, 124, 92];
    if (n < 0.03) return [226, 200, 158];
    if (rut && hash(x >> 2, y, 2) > 0.3) return [176, 146, 108];
    if ((x < 10 || x > WW - 30) && hash(x >> 1, y >> 1, 9) > 0.8) return [120, 130, 70]; // mato seco na beira
    return (x + y * 5) % 9 === 0 ? [192, 162, 120] : [200, 170, 128];
  }));
  const houseRow = sprite(r, houses(), HOUSE_PAL);
  const palmS = sprite(r, palm(), PALM_PAL, { radius: 2, strength: 1.6, materialEdges: 0.2 });
  const treeBack = sprite(r, tree(false), TREE_PAL);
  const treeFront = sprite(r, tree(true), TREE_PAL, { radius: 2, strength: 1.8, materialEdges: 0.2 });
  const shade = r.texture(paint(64, 16, (x, y) => (Math.hypot((x - 32) / 32, (y - 8) / 8) < 1 ? [0, 0, 0, 255] : null)));

  return {
    floorY: FLOOR_Y,
    look: {
      ambient: [0.36, 0.36, 0.4],
      fogColor: [0.82, 0.84, 0.88], fogNear: 10, fogFar: -90, fogMax: 0.35,
      bloom: 0.6, bloomThreshold: 0.95,
      rays: { x: 159, y: 49, strength: 0.35, decay: 0.95, parallax: 0.03 },
    },

    lights(): Light[] {
      return [
        { x: 0.55, y: -1, z: 0.45, radius: 0, color: [1, 0.94, 0.82], intensity: 1.05, directional: true },
        { x: -0.6, y: -1, z: 0.2, radius: 0, color: [0.55, 0.66, 0.9], intensity: 0.3, directional: true, castShadows: false },
      ];
    },

    back(t) {
      r.unlit(sky, { x: 0, y: 0, w: r.w, h: HORIZON + 8 }, { parallax: 0 });
      r.unlit(sun, { x: 150, y: 40, w: 19, h: 19 }, { parallax: 0.03, emissive: 1.6 });
      const drift = (t * 2) % WW;
      for (const dx of [0, WW]) r.unlit(clouds, { x: W0 - drift + dx, y: 10, w: WW, h: 60 }, { parallax: 0.08 });
      r.unlit(hills, { x: W0, y: HORIZON - 34, w: WW, h: 46 }, { parallax: 0.2, fog: 0.4, anchorY: HORIZON });
      r.floor(ground, { x: W0, y: HORIZON, w: WW, h: r.h - FLOOR_Y + 40 + (FLOOR_Y - HORIZON) });
      // sombra da copa no chão (mancha suave)
      const p = r.project(TX - 6, 0, TZ);
      r.floor(shade, { x: Math.round(p.x - 50), y: Math.round(p.y - 8), w: 100, h: 18 }, { tint: [0, 0, 0, 0.35] });
    },

    props(): Drawable[] {
      return [
        { z: -40, draw: () => r.billboard(houseRow.tex, 90, -40, houseRow.w, houseRow.h, { normal: houseRow.n }) },
        { z: -30, draw: () => r.billboard(palmS.tex, -20, -30, palmS.w, palmS.h, { normal: palmS.n }) },
        { z: -34, draw: () => r.billboard(palmS.tex, 214, -34, palmS.w, palmS.h, { normal: palmS.n, flipX: true }) },
        { z: TZ - 0.5, draw: () => r.billboard(treeBack.tex, TX, TZ - 0.5, TREE_W, TREE_H, { normal: treeBack.n }) },
        { z: TZ + 2, draw: () => r.billboard(treeFront.tex, TX, TZ - 0.5, TREE_W, TREE_H, { normal: treeFront.n, z: TZ + 2 }) },
      ];
    },

    front(t) {
      // poeira brilhando no sol
      for (let i = 0; i < 26; i++) {
        const x = ((hash(i, 1) * 260 + t * (4 + hash(i, 2) * 6)) % 260) - 40;
        const y = -10 - hash(i, 3) * 90 + Math.sin(t * 0.8 + i) * 4;
        r.dot(x, y, 20 + hash(i, 4) * 60, [1, 0.95, 0.8], { emissive: 0.6, alpha: 0.7 });
      }
    },
  };
};
