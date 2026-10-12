// Cenário: esquina movimentada de uma cidade, de dia (Mt 6:5, "às esquinas das ruas").
// Casas de pedra de dois andares no fundo com uma rua que entra entre elas, a casa da esquina
// na frente à direita (pedras grandes no canto), banca de feira com toldo listrado à esquerda e
// um degrau de pedra onde dá pra subir pra ser visto. Os figurantes que passam são personagens da cena.
// Parâmetros: stepX, stepZ (degrau; quem pisa nele fica 5 px mais alto).
import type { SetFactory, Drawable } from "./types";
import { paint } from "./types";
import { hash, fbm2 } from "../core/noise";
import { normalMap, gridToBitmap, type Grid, type Palette } from "../core/pixels";
import type { Light } from "../core/renderer";

const FLOOR_Y = 204;
const HORIZON = FLOOR_Y - 30;
const W0 = -80, WW = 340;
const STEP_W = 34, STEP_H = 6;

type C = [number, number, number];
const SKY: C[] = [[86, 150, 214], [110, 168, 224], [140, 190, 232], [176, 210, 236], [214, 228, 234]];

const grid = (w: number, h: number, f: (x: number, y: number) => string): Grid =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y)).join(""));

function sprite(r: Parameters<SetFactory>[0], g: Grid, pal: Palette, normals = { radius: 3, strength: 2, materialEdges: 0.3 }) {
  return { tex: r.texture(gridToBitmap(g, pal)), n: r.texture(normalMap(g, normals)), w: g[0].length, h: g.length };
}

// ---- casas de pedra (fundo): dois andares, portas em arco, janelas com pano, rua entrando no meio
const STONE: Palette = {
  a: [214, 196, 160], b: [196, 176, 138], c: [178, 156, 118], m: [150, 130, 98], r: [228, 214, 182],
  d: [48, 34, 26], w: [64, 46, 34], k: [120, 40, 46], g: [60, 96, 70], p: [110, 76, 46], s: [92, 64, 40],
};
const ALLEY = [128, 172]; // vão da rua que entra (coordenadas do desenho)
function townRow(): Grid {
  const W = WW, H = 104;
  const rows: string[][] = Array.from({ length: H }, () => Array(W).fill("."));
  let x = 0, i = 0;
  while (x < W) {
    const w = 40 + Math.floor(hash(i, 1, 5) * 30), h = 62 + Math.floor(hash(i, 2, 5) * 40);
    const tone = ["a", "b", "c"][Math.floor(hash(i, 3, 5) * 3)];
    const top = H - h;
    for (let xx = x; xx < Math.min(W, x + w); xx++) {
      if (xx >= ALLEY[0] && xx < ALLEY[1]) continue;
      for (let y = top; y < H; y++) {
        const lx = xx - x, ly = y - top;
        let ch = tone;
        if ((Math.floor(ly / 5) + (Math.floor(lx / 8) + Math.floor(ly / 5)) % 2) % 2 === 0 && hash(lx >> 3, ly / 5 | 0, i) > 0.7) ch = "m"; // blocos de pedra
        if (ly % 5 === 0 && hash(xx, y, 3) > 0.6) ch = "m";
        if (ly < 3) ch = "r"; // mureta do terraço
        if (ly === Math.floor(h / 2)) ch = "s"; // viga entre os andares
        // porta em arco
        const dx = lx - w / 2;
        if (Math.abs(dx) < 6 && ly > h - 20 && (ly > h - 15 || Math.hypot(dx, ly - (h - 15)) < 6)) ch = "d";
        // janelas do andar de cima com pano colorido
        const wx = lx % 16, wy = ly - 10;
        if (lx > 4 && lx < w - 6 && wx > 5 && wx < 11 && wy > 0 && wy < 10) ch = wy < 4 ? (i % 3 === 0 ? "k" : i % 3 === 1 ? "g" : "p") : "w";
        rows[y][xx] = ch;
      }
    }
    x += w + (hash(i, 4, 5) > 0.7 ? 4 : 0);
    i++;
  }
  return rows.map((r) => r.join(""));
}

// ---- casas lá no fim da rua que entra (menores, mais claras)
function farRow(): Grid {
  return grid(ALLEY[1] - ALLEY[0] + 10, 50, (x, y) => {
    const i = Math.floor(x / 14), h = 30 + Math.floor(hash(i, 7) * 16);
    if (y < 50 - h) return ".";
    if (y === 50 - h) return "r";
    if (x % 14 > 5 && x % 14 < 9 && y > 50 - h + 6 && y < 50 - h + 12) return "w";
    return i % 2 ? "a" : "b";
  });
}

// ---- casa da esquina (frente, à direita): canto com pedras grandes alternadas
function corner(): Grid {
  const W = 70, H = 150;
  return grid(W, H, (x, y) => {
    if (y < 4) return "r";
    if (x < 10) { // pedras do canto (cunhal)
      const course = Math.floor(y / 9), long = course % 2 === 0;
      if (x >= (long ? 10 : 6)) return "b";
      return y % 9 === 0 || x === 0 ? "m" : "r";
    }
    if (y > 70 && y < 100 && x > 30 && x < 52) return y < 74 || x < 33 || x > 49 ? "p" : "w"; // janela
    if (y % 8 === 0 || (x + Math.floor(y / 8) * 11) % 19 === 0) return "m";
    const n = fbm2(x / 9, y / 9, 13);
    return n > 0.6 ? "a" : n < 0.4 ? "c" : "b";
  });
}

// ---- banca de feira: mesa, toldo listrado, cestos de frutas e jarros
const STALL_PAL: Palette = {
  R: [200, 52, 52], W: [240, 232, 214], t: [118, 82, 50], u: [88, 60, 36], o: [236, 150, 40], y: [230, 206, 70],
  g: [96, 150, 62], v: [126, 54, 120], j: [178, 110, 66], k: [140, 84, 50],
};
function stall(): Grid {
  const W = 60, H = 52;
  return grid(W, H, (x, y) => {
    if (y < 10) { // toldo listrado com borda ondulada
      if (y === 9 && x % 6 > 2) return ".";
      return Math.floor(x / 6) % 2 ? "R" : "W";
    }
    if ((x === 3 || x === 56) && y < H) return "u"; // postes
    if (y >= 30 && y < 34 && x > 1 && x < 58) return y === 30 ? "t" : "u"; // tampo
    if (y >= 34 && (x === 6 || x === 53)) return "u";
    // frutas em cima do tampo
    if (y >= 24 && y < 30) {
      const b = Math.floor((x - 6) / 12), bx = (x - 6) % 12 - 6, by = 30 - y;
      if (x > 5 && b < 4 && Math.abs(bx) < 5 && by < 4) return by < 1 ? "k" : ["o", "y", "g", "v"][b];
      if (x > 5 && b < 4 && Math.abs(bx) < 4 - (by - 3) && by >= 4) return ["o", "y", "g", "v"][b];
    }
    // jarros no chão
    if (y > 38) {
      const jx = x - 24, jy = y - 38;
      if (Math.abs(jx) < 5 - (jy < 3 ? 2 : 0) && jy < 13) return "j";
      const kx = x - 40;
      if (Math.abs(kx) < 4 - (jy < 2 ? 2 : 0) && jy > 2) return "k";
    }
    return ".";
  });
}

export const esquina: SetFactory = (r, params) => {
  const SX = (params.stepX as number) ?? 100, SZ = (params.stepZ as number) ?? 6;

  const sky = r.texture(paint(r.w, HORIZON + 8, (x, y) => SKY[Math.min(4, Math.floor((y / (HORIZON + 8)) * 5))]));
  const sun = r.texture(paint(17, 17, (x, y) => (Math.hypot(x - 8, y - 8) <= 8.2 ? [255, 248, 220] : null)));
  const clouds = r.texture(paint(WW, 50, (x, y) => {
    const v = fbm2(x / 34, y / 8, 31) - Math.abs(y - 22) / 60;
    return v > 0.52 ? (v > 0.6 ? [252, 252, 250] : [228, 234, 242]) : null;
  }));
  // pedra do calçamento: lajes irregulares + a rua que entra (mais escura, em perspectiva)
  const ground = r.texture(paint(WW, r.h - HORIZON + 40, (x, y) => {
    const row = Math.floor(y / 7), off = row % 2 ? 9 : 0;
    const joint = y % 7 === 0 || (x + off) % 18 === 0;
    const n = hash((x + off) / 18 | 0, row, 3);
    if (joint) return [150, 132, 106];
    if (hash(x, y, 8) > 0.97) return [236, 222, 190];
    return n > 0.66 ? [214, 196, 162] : n > 0.33 ? [204, 186, 152] : [194, 176, 142];
  }));
  const alleyFloor = r.texture(paint(ALLEY[1] - ALLEY[0], 30, (x, y) => (y % 5 === 0 ? [160, 142, 112] : [186, 168, 134])));
  const town = sprite(r, townRow(), STONE);
  const far = sprite(r, farRow(), STONE, { radius: 2, strength: 1.4, materialEdges: 0.2 });
  const cornerS = sprite(r, corner(), STONE);
  const stallS = sprite(r, stall(), STALL_PAL, { radius: 2, strength: 1.8, materialEdges: 0.3 });
  const STEP: Grid = grid(STEP_W, STEP_H, (x, y) => (y === 0 ? "r" : x % 11 === 0 || y === STEP_H - 1 ? "m" : "b"));
  const step = sprite(r, STEP, STONE, { radius: 1, strength: 2, materialEdges: 0.4 });
  const shade = r.texture(paint(64, 16, (x, y) => (Math.hypot((x - 32) / 32, (y - 8) / 8) < 1 ? [0, 0, 0, 255] : null)));
  // pombos ciscando (2 px) perto da banca
  const pigeons = [[-6, 14], [2, 18], [-14, 22]];

  const onStep = (x: number, z: number) => Math.abs(x - SX) < STEP_W / 2 - 2 && Math.abs(z - SZ) < 5;

  return {
    floorY: FLOOR_Y,
    look: {
      ambient: [0.38, 0.37, 0.4],
      fogColor: [0.84, 0.86, 0.9], fogNear: 10, fogFar: -100, fogMax: 0.3,
      bloom: 0.55, bloomThreshold: 0.95,
      rays: { x: 32, y: 40, strength: 0.25, decay: 0.95, parallax: 0.03 },
    },

    lights(): Light[] {
      return [
        { x: -0.5, y: -1, z: 0.5, radius: 0, color: [1, 0.95, 0.84], intensity: 1.05, directional: true },
        { x: 0.6, y: -1, z: 0.2, radius: 0, color: [0.56, 0.66, 0.9], intensity: 0.3, directional: true, castShadows: false },
      ];
    },

    surface(x, z) { return { lift: onStep(x, z) ? STEP_H - 1 : 0, water: false }; },

    back(t) {
      r.unlit(sky, { x: 0, y: 0, w: r.w, h: HORIZON + 8 }, { parallax: 0 });
      r.unlit(sun, { x: 24, y: 32, w: 17, h: 17 }, { parallax: 0.03, emissive: 1.5 });
      const drift = (t * 1.5) % WW;
      for (const dx of [0, WW]) r.unlit(clouds, { x: W0 - drift + dx, y: 14, w: WW, h: 50 }, { parallax: 0.08 });
      r.floor(ground, { x: W0, y: HORIZON, w: WW, h: r.h - HORIZON + 40 });
      r.floor(alleyFloor, { x: W0 + ALLEY[0], y: HORIZON - 4, w: ALLEY[1] - ALLEY[0], h: 30 }, { tint: [0.1, 0.08, 0.06, 0.25] });
      const p = r.project(SX, 0, SZ + 2);
      r.floor(shade, { x: Math.round(p.x - STEP_W / 2 - 4), y: Math.round(p.y - 5), w: STEP_W + 8, h: 10 }, { tint: [0, 0, 0, 0.25] });
    },

    props(t): Drawable[] {
      return [
        { z: -70, draw: () => r.billboard(far.tex, W0 + ALLEY[0] + (ALLEY[1] - ALLEY[0]) / 2, -70, far.w, far.h, { normal: far.n }) },
        { z: -44, draw: () => r.billboard(town.tex, W0 + WW / 2, -44, town.w, town.h, { normal: town.n }) },
        { z: -18, draw: () => r.billboard(stallS.tex, 6, -18, stallS.w, stallS.h, { normal: stallS.n }) },
        { z: -8, draw: () => r.billboard(cornerS.tex, 214, -8, cornerS.w, cornerS.h, { normal: cornerS.n }) },
        { z: SZ - 4, draw: () => r.billboard(step.tex, SX, SZ - 4, STEP_W, STEP_H, { normal: step.n }) },
        ...pigeons.map(([px, pz], i) => ({
          z: pz,
          draw: () => {
            const peck = Math.sin(t * 5 + i * 2) > 0.6 ? 1 : 0;
            const x = px + Math.sin(t * 0.4 + i) * 3;
            r.dot(x, -1 + peck, pz, [0.42, 0.44, 0.5]);
            r.dot(x + 1, -2 + peck, pz, [0.5, 0.52, 0.58]);
          },
        })),
      ];
    },

    front(t) {
      for (let i = 0; i < 18; i++) {
        const x = ((hash(i, 1, 4) * 260 + t * (3 + hash(i, 2, 4) * 5)) % 260) - 40;
        const y = -10 - hash(i, 3, 4) * 90 + Math.sin(t * 0.8 + i) * 4;
        r.dot(x, y, 20 + hash(i, 4, 4) * 60, [1, 0.95, 0.82], { emissive: 0.5, alpha: 0.6 });
      }
    },
  };
};
