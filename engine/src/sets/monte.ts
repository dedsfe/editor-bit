// Cenário: lugar tranquilo no alto do monte, ao amanhecer. Céu indo do azul da noite pro laranja,
// sol nascendo atrás dos morros (com raios), o lago lá embaixo brilhando, oliveira retorcida,
// capim com orvalho e uma pedra grande onde se ajoelha pra orar. Luz baixa e quente vindo do sol.
// Parâmetros: rockX, rockZ (pedra), treeX (oliveira).
import type { SetFactory, Drawable } from "./types";
import { paint } from "./types";
import { hash, fbm1, fbm2 } from "../core/noise";
import { normalMap, gridToBitmap, type Grid, type Palette } from "../core/pixels";
import type { Light } from "../core/renderer";

const FLOOR_Y = 206;
const HORIZON = FLOOR_Y - 40;
const W0 = -80, WW = 340;
const SUN_X = 128, SUN_Y = HORIZON - 52;

type C = [number, number, number];
// de cima pra baixo: azul da noite → violeta → rosa → laranja → amarelo no horizonte
const SKY: C[] = [[38, 52, 112], [70, 74, 140], [128, 96, 152], [206, 124, 132], [244, 160, 108], [255, 200, 120], [255, 226, 160]];
const mix = (a: C, b: C, k: number): C => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const grid = (w: number, h: number, f: (x: number, y: number) => string): Grid =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y)).join(""));

function sprite(r: Parameters<SetFactory>[0], g: Grid, pal: Palette, normals = { radius: 3, strength: 2, materialEdges: 0.3 }) {
  return { tex: r.texture(gridToBitmap(g, pal)), n: r.texture(normalMap(g, normals)), w: g[0].length, h: g.length };
}

// ---- oliveira: tronco retorcido e copa verde-prateada
const OLIVE_PAL: Palette = { t: [104, 82, 62], u: [74, 58, 44], v: [130, 104, 80], g: [104, 128, 92], h: [80, 104, 74], l: [150, 168, 130], k: [58, 78, 56] };
function olive(): Grid {
  const W = 84, H = 92, cx = 40;
  const clumps = [[22, 30, 16], [44, 20, 20], [64, 32, 16], [34, 42, 14], [56, 46, 12], [12, 44, 10]];
  return grid(W, H, (x, y) => {
    const bh = H - y;
    const sway = Math.sin(bh * 0.09) * 5 + Math.sin(bh * 0.23) * 2;
    if (bh < 50 && Math.abs(x - cx - sway) < 4 + Math.max(0, 8 - bh) * 0.5) return x - cx - sway < -1 ? "u" : x - cx - sway > 2 ? "v" : (y % 5 ? "t" : "u");
    const c = clumps.find(([px, py, rr]) => Math.hypot(x - px, (y - py) * 1.3) < rr * (0.8 + fbm2(x / 5, y / 5, 17) * 0.4));
    if (!c) return ".";
    const n = fbm2(x / 3, y / 3, 19);
    if (n < 0.34) return ".";
    return n > 0.64 ? "l" : n > 0.5 ? "g" : n > 0.42 ? "h" : "k";
  });
}

// ---- pedra grande (onde se ajoelha) e pedrinhas
const ROCK_PAL: Palette = { a: [150, 138, 128], b: [124, 112, 104], c: [176, 164, 150], d: [96, 86, 80], m: [110, 124, 84] };
function rock(w: number, h: number, seed: number): Grid {
  return grid(w, h, (x, y) => {
    const nx = (x - w / 2) / (w / 2), ny = (h - y) / h;
    const top = 1 - nx * nx * (0.9 + fbm1(x / 6, seed) * 0.3);
    if (ny > top) return ".";
    if (ny > top - 0.12 && hash(x, seed) > 0.5) return "m"; // musgo em cima
    const n = fbm2(x / 4, y / 4, seed);
    return n > 0.62 ? "c" : n < 0.36 ? "d" : x < w / 2 ? "a" : "b";
  });
}

// ---- tufos de capim na frente de tudo
const GRASS_PAL: Palette = { g: [96, 128, 60], h: [72, 104, 48], y: [186, 170, 88], f: [236, 220, 120], p: [210, 140, 190] };
function tuft(seed: number): Grid {
  return grid(14, 10, (x, y) => {
    for (let k = 0; k < 5; k++) {
      const bx = 2 + k * 2.5 + hash(k, seed) * 2, lean = (hash(k, seed, 2) - 0.5) * 0.8, len = 5 + hash(k, seed, 3) * 5;
      const yy = 10 - y;
      if (yy < len && Math.abs(x - (bx + lean * yy)) < 0.7) return k % 3 === 0 ? "y" : k % 2 ? "h" : "g";
    }
    if (y === 3 && hash(seed, 9) > 0.5 && x === 6) return hash(seed, 8) > 0.5 ? "f" : "p"; // florzinha
    return ".";
  });
}

export const monte: SetFactory = (r, params) => {
  const RX = (params.rockX as number) ?? 118, RZ = (params.rockZ as number) ?? 14;
  const TX = (params.treeX as number) ?? 20;

  const skyH = HORIZON + 10;
  const sky = r.texture(paint(r.w, skyH, (x, y) => {
    const k = (y / skyH) * (SKY.length - 1), i = Math.min(SKY.length - 2, Math.floor(k));
    // faixas (8-bit) com um pouco de dither entre elas
    const f = k - i, step = f > 0.8 ? 1 : f > 0.65 && (x + y) % 2 === 0 ? 1 : 0; // faixas com 1 linha de xadrez
    if (y < 40 && hash(x, y, 3) > 0.9985) return [255, 240, 230]; // últimas estrelas
    return SKY[i + step];
  }));
  const sun = r.texture(paint(25, 13, (x, y) => (Math.hypot(x - 12, y - 12) <= 12.2 ? (Math.hypot(x - 12, y - 12) > 10 ? [255, 214, 140] : [255, 246, 214]) : null)));
  const clouds = r.texture(paint(WW, 40, (x, y) => {
    const v = fbm2(x / 40, y / 5, 41) - Math.abs(y - 18) / 40;
    if (v < 0.5) return null;
    // nuvem fininha iluminada por baixo
    return v > 0.58 ? [255, 196, 160] : [214, 136, 150];
  }));
  // morros em camadas (mais longe = mais azul/violeta)
  const ridge = (x: number, s: number, a: number) => Math.round(a * (0.5 + 0.5 * Math.sin(x * 0.018 + s)) + a * 0.4 * Math.sin(x * 0.061 + s * 2));
  const layer = (seed: number, amp: number, c: C, top: C) => r.texture(paint(WW, 60, (x, y) => {
    const h = 30 + ridge(x, seed, amp);
    if (y < 60 - h) return null;
    return y < 60 - h + 1 ? top : c;
  }));
  const hillsFar = layer(1.2, 14, [124, 96, 150], [210, 150, 150]);
  const hillsMid = layer(4.1, 10, [88, 74, 116], [190, 128, 120]);
  // lago lá embaixo: faixa clara com brilho do sol
  const lake = r.texture(paint(WW, 8, (x, y) => {
    const glint = Math.abs(x - (SUN_X - W0)) < 16 - y * 1.5 && hash(x, y, 4) > 0.35;
    return glint ? [255, 222, 170] : y < 1 ? [200, 150, 160] : [150, 120, 160];
  }));
  const ground = r.texture(paint(WW, r.h - HORIZON + 40, (x, y) => {
    const n = fbm2(x / 14, y / 5, 23), d = hash(x, y, 31);
    if (d > 0.997) return [255, 236, 200]; // orvalho brilhando
    if (d < 0.003) return [214, 150, 196]; // florzinha
    if (y < 3) return [176, 150, 92];
    const base: C = n > 0.58 ? [126, 140, 70] : n > 0.42 ? [108, 126, 62] : [92, 110, 58];
    return mix(base, [190, 150, 96], Math.max(0, 0.35 - y / 120)); // perto do horizonte o capim pega a luz dourada
  }));
  const oliveS = sprite(r, olive(), OLIVE_PAL, { radius: 2, strength: 1.6, materialEdges: 0.2 });
  const big = sprite(r, rock(30, 16, 5), ROCK_PAL);
  const small = sprite(r, rock(12, 6, 9), ROCK_PAL);
  const tufts = [0, 1, 2, 3].map((s) => sprite(r, tuft(s), GRASS_PAL, { radius: 1, strength: 1.4, materialEdges: 0.1 }));
  const shade = r.texture(paint(64, 16, (x, y) => (Math.hypot((x - 32) / 32, (y - 8) / 8) < 1 ? [0, 0, 0, 255] : null)));
  const mist = r.texture(paint(WW, 14, (x, y) => {
    const v = fbm2(x / 30, y / 4, 51) - Math.abs(y - 7) / 14;
    return v > 0.38 ? [255, 214, 196, 120] : null;
  }));
  // pássaros longe, cruzando o céu
  const birds = [[0, 0.6], [1, 0.9], [2, 0.75]];
  const birdTex = [
    r.texture(paint(5, 2, (x, y) => ((y === 0 && (x === 0 || x === 4)) || (y === 1 && x > 0 && x < 4 && x !== 2) || (y === 0 && x === 2) ? [60, 40, 70] : null))),
    r.texture(paint(5, 2, (x, y) => ((y === 1 && (x === 0 || x === 4)) || (y === 0 && x > 0 && x < 4) ? [60, 40, 70] : null))),
  ];

  return {
    floorY: FLOOR_Y,
    look: {
      ambient: [0.3, 0.26, 0.34],
      fogColor: [0.96, 0.7, 0.62], fogNear: 0, fogFar: -90, fogMax: 0.4,
      bloom: 0.9, bloomThreshold: 0.85,
      rays: { x: SUN_X + 12, y: SUN_Y + 8, strength: 0.55, decay: 0.955, parallax: 0.05 },
    },

    lights(): Light[] {
      return [
        // sol baixo, de trás e da direita: contorno quente
        { x: 0.55, y: -0.32, z: -0.75, radius: 0, color: [1, 0.72, 0.46], intensity: 1.1, directional: true },
        // céu ainda azulado enchendo as sombras
        { x: -0.4, y: -1, z: 0.6, radius: 0, color: [0.56, 0.56, 0.86], intensity: 0.45, directional: true, castShadows: false },
      ];
    },

    back(t) {
      r.unlit(sky, { x: 0, y: 0, w: r.w, h: skyH }, { parallax: 0 });
      const drift = (t * 0.8) % WW;
      for (const dx of [0, WW]) r.unlit(clouds, { x: W0 - drift + dx, y: 30, w: WW, h: 40 }, { parallax: 0.06 });
      r.unlit(sun, { x: SUN_X, y: SUN_Y, w: 25, h: 13 }, { parallax: 0.05, emissive: 2.2 });
      r.unlit(hillsFar, { x: W0, y: HORIZON - 52, w: WW, h: 60 }, { parallax: 0.12, fog: 0.2, anchorY: HORIZON });
      r.unlit(lake, { x: W0, y: HORIZON - 6, w: WW, h: 8 }, { parallax: 0.2, emissive: 0.3, anchorY: HORIZON });
      r.unlit(hillsMid, { x: W0 + 30, y: HORIZON - 40, w: WW, h: 60 }, { parallax: 0.3, fog: 0.1, anchorY: HORIZON + 14 });
      r.floor(ground, { x: W0, y: HORIZON, w: WW, h: r.h - HORIZON + 40 });
      const p = r.project(TX + 8, 0, -20);
      r.floor(shade, { x: Math.round(p.x - 40), y: Math.round(p.y - 6), w: 80, h: 14 }, { tint: [0.1, 0, 0.2, 0.3] });
      for (const [i, sp] of birds) {
        const bx = ((t * 9 * sp + i * 70) % 260) - 40, by = 60 + i * 14 + Math.sin(t * 2 + i) * 3;
        const flap = Math.floor(t * 6 + i) % 2;
        r.unlit(birdTex[flap], { x: Math.round(bx), y: Math.round(by), w: 5, h: 2 }, { parallax: 0.1 });
      }
      r.unlit(mist, { x: W0, y: HORIZON - 8, w: WW, h: 14 }, { parallax: 0.35, anchorY: HORIZON + 6 });
    },

    props(): Drawable[] {
      return [
        { z: -20, draw: () => r.billboard(oliveS.tex, TX, -20, oliveS.w, oliveS.h, { normal: oliveS.n }) },
        { z: RZ - 6, draw: () => r.billboard(big.tex, RX, RZ - 6, big.w, big.h, { normal: big.n }) },
        { z: -6, draw: () => r.billboard(small.tex, 168, -6, small.w, small.h, { normal: small.n }) },
        { z: 30, draw: () => r.billboard(small.tex, 42, 30, small.w, small.h, { normal: small.n, flipX: true }) },
        { z: 52, draw: () => r.billboard(tufts[0].tex, 8, 52, 14, 10, { normal: tufts[0].n }) },
        { z: 58, draw: () => r.billboard(tufts[1].tex, 150, 58, 14, 10, { normal: tufts[1].n }) },
        { z: 40, draw: () => r.billboard(tufts[2].tex, 172, 40, 14, 10, { normal: tufts[2].n }) },
        { z: 4, draw: () => r.billboard(tufts[3].tex, 64, 4, 14, 10, { normal: tufts[3].n }) },
      ];
    },

    front(t) {
      // poeirinha dourada flutuando na luz
      for (let i = 0; i < 16; i++) {
        const x = ((hash(i, 1, 6) * 240 + t * (2 + hash(i, 2, 6) * 3)) % 240) - 30;
        const y = -6 - hash(i, 3, 6) * 70 + Math.sin(t * 0.6 + i) * 5;
        r.dot(x, y, 10 + hash(i, 4, 6) * 50, [1, 0.86, 0.6], { emissive: 0.7, alpha: 0.55 });
      }
    },
  };
};
