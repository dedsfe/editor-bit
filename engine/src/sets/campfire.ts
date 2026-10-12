// Cenário: noite, fogueira, lua, morros em parallax, brasas subindo.
// Parâmetros: { fireX, fireZ }
import type { SetFactory, Drawable } from "./types";
import { paint } from "./types";
import { hash, fbm1 } from "../core/noise";
import { normalMap, type Grid } from "../core/pixels";
import type { Light } from "../core/renderer";

const FLOOR_Y = 200;
const SKY = [[8, 10, 30], [12, 15, 42], [17, 21, 55], [24, 28, 68], [32, 34, 78]];
const FIRE_PAL: [number, [number, number, number]][] = [
  [0.82, [255, 248, 200]], [0.6, [255, 204, 70]], [0.38, [244, 116, 34]], [0.18, [176, 42, 22]],
];

const ROCK: Grid = [
  "...AAAA...",
  ".AABBBBAA.",
  "ABBBBBBBBA",
  "ABBBBBBCBA",
  "ABBBCCCCBA",
  ".ACCCCCCA.",
];
const STONE: Grid = [".AA.", "ABBA", "BCCB"];

export const campfire: SetFactory = (r, params) => {
  const FX = (params.fireX as number) ?? 116, FZ = (params.fireZ as number) ?? 50;
  const W0 = -60, WW = 300; // o mundo é mais largo que a tela, pra câmera poder andar

  const sky = r.texture(paint(r.w, r.h, (x, y) => {
    if (hash(x, y, 7) > 0.993 && y < 150) return [220, 225, 255];
    const band = Math.min(SKY.length - 1, Math.floor((y / FLOOR_Y) * SKY.length));
    return SKY[band] as [number, number, number];
  }));
  const moon = r.texture(paint(15, 15, (x, y) => {
    const d = Math.hypot(x - 7, y - 7);
    if (d > 7.2) return null;
    const crater = hash(x, y, 3) > 0.82 && d < 5.5 ? 0.86 : 1;
    const shade = x + y > 20 ? 0.9 : 1;
    return [255 * crater * shade, 246 * crater * shade, 210 * crater * shade];
  }));
  const ridge = (seed: number, base: number, amp: number) => (x: number) =>
    base + Math.round(amp * (Math.sin(x * 0.03 + seed) * 0.6 + Math.sin(x * 0.11 + seed * 3) * 0.3 + (hash(x >> 2, seed) - 0.5) * 0.2));
  const farTop = ridge(1, 18, 10), nearTop = ridge(4, 26, 8);
  const farHills = r.texture(paint(WW, 50, (x, y) => (y >= farTop(x) ? [30, 32, 62] : null)));
  const nearHills = r.texture(paint(WW, 50, (x, y) => {
    if (y < nearTop(x)) {
      // arbustos/oliveiras recortados no topo
      const tree = (x % 37 < 9) && y >= nearTop(x) - 9 + Math.abs((x % 37) - 4);
      return tree ? [16, 18, 34] : null;
    }
    return [16, 18, 34];
  }));
  const ground = r.texture(paint(WW, r.h - FLOOR_Y + 24, (x, y) => {
    const n = hash(x, y, 11);
    if (y < 2) return [38, 44, 40];
    if (n > 0.94) return [84, 74, 58];
    if (n < 0.05) return [36, 30, 26];
    if (hash(x >> 1, y >> 1, 12) > 0.97) return [52, 70, 44]; // tufinho de mato
    return (x + y * 3) % 7 === 0 ? [60, 52, 42] : [66, 56, 44];
  }));
  const logs = r.texture(paint(18, 6, (x, y) => {
    const a = Math.abs(y - x * 0.32) < 1.2, b = Math.abs(y - (5 - (x - 2) * 0.32)) < 1.2;
    return a || b ? (hash(x, y) > 0.5 ? [104, 64, 34] : [78, 46, 24]) : null;
  }));
  const rockPal: Record<string, [number, number, number]> = { A: [70, 70, 78], B: [104, 102, 108], C: [84, 82, 90] };
  const mk = (g: Grid) => ({
    tex: r.texture(paint(g[0].length, g.length, (x, y) => rockPal[g[y][x]] ?? null)),
    n: r.texture(normalMap(g, { radius: 2, strength: 2.5, materialEdges: 0 })),
    w: g[0].length, h: g.length,
  });
  const rock = mk(ROCK), stone = mk(STONE);

  const fireBmp = (t: number) => {
    const fw = 13, fh = 20, f = Math.floor(t * 12);
    return paint(fw, fh, (x, y) => {
      const up = 1 - y / fh;
      const sway = Math.sin(t * 6 + y * 0.5) * up * 1.6 + (fbm1(t * 3, 9) - 0.5) * up * 2;
      const dx = Math.abs(x - (fw - 1) / 2 - sway) / ((fw / 2) * (1 - up * 0.85) + 0.5);
      let heat = (1 - dx) * (1 - up * 0.88) * 1.25;
      heat -= hash(x, y, f) * 0.35 * up;
      for (const [lim, c] of FIRE_PAL) if (heat > lim) return c;
      return null;
    });
  };
  const fireTex = r.texture(fireBmp(0));

  const flicker = (t: number) => fbm1(t * 7, 1) * 0.55 + Math.sin(t * 23) * 0.06;

  return {
    floorY: FLOOR_Y,
    look: {
      ambient: [0.05, 0.06, 0.13],
      fogColor: [0.09, 0.1, 0.2], fogNear: 10, fogFar: -60, fogMax: 0.55,
      bloom: 1.1, bloomThreshold: 0.8,
      rays: { x: 31.5, y: 99.5, strength: 0.5, decay: 0.94, parallax: 0.04 },
    },

    lights(t): Light[] {
      const f = flicker(t);
      return [
        { x: FX + (fbm1(t * 5, 2) - 0.5) * 2, y: -14, z: FZ + 2, radius: 135, color: [1, 0.55, 0.22], intensity: 1.15 + f },
        { x: FX, y: -2, z: FZ + 4, radius: 46, color: [1, 0.35, 0.1], intensity: 0.5 + f * 0.6, castShadows: false },
        { x: -0.5, y: -1, z: -0.35, radius: 0, color: [0.45, 0.55, 0.95], intensity: 0.42, directional: true },
      ];
    },

    back(t) {
      r.unlit(sky, { x: 0, y: 0, w: r.w, h: FLOOR_Y + 10 }, { parallax: 0 });
      // estrelas piscando
      for (let i = 0; i < 14; i++) {
        const sx = Math.floor(hash(i, 21) * r.w), sy = Math.floor(hash(i, 22) * 140);
        const tw = fbm1(t * 2 + i * 7, 30 + i);
        if (tw > 0.55) r.unlit(r.white, { x: sx, y: sy, w: 1, h: 1 }, { parallax: 0, tint: [0.9, 0.92, 1, 1], emissive: tw });
      }
      r.unlit(moon, { x: 24, y: 92, w: 15, h: 15 }, { parallax: 0.04, emissive: 1.4 });
      const horizon = FLOOR_Y - 24; // topo do chão: os morros encostam aqui mesmo com zoom
      r.unlit(farHills, { x: W0, y: horizon - 30, w: WW, h: 50 }, { parallax: 0.25, fog: 0.3, anchorY: horizon });
      r.unlit(nearHills, { x: W0, y: horizon - 24, w: WW, h: 50 }, { parallax: 0.55, fog: 0.1, anchorY: horizon });
      r.floor(ground, { x: W0, y: FLOOR_Y - 24, w: WW, h: r.h - FLOOR_Y + 24 });
    },

    props(t): Drawable[] {
      r.update(fireTex, fireBmp(t));
      const stones: Drawable[] = [[-9, 1], [9, 1], [-5, 4], [5, 4], [0, 5]].map(([dx, dz]) => ({
        z: FZ + dz, draw: () => r.billboard(stone.tex, FX + dx, FZ + dz, stone.w, stone.h, { normal: stone.n }),
      }));
      return [
        { z: FZ + 0.5, draw: () => r.billboard(logs, FX, FZ + 0.5, 18, 6) },
        { z: FZ + 0.6, draw: () => r.billboard(fireTex, FX, FZ - 1, 13, 20, { emissive: 1.2, z: FZ + 0.6 }) },
        ...stones,
        { z: 86, draw: () => r.billboard(rock.tex, 22, 86, rock.w * 2, rock.h * 2, { normal: rock.n }) },
        { z: 10, draw: () => r.billboard(rock.tex, 160, 10, rock.w, rock.h, { normal: rock.n }) },
      ];
    },

    front(t) {
      // brasas: cada uma é função pura do tempo (mesmo frame no preview e no export)
      for (let i = 0; i < 40; i++) {
        const life = 1.2 + hash(i, 1) * 1.4;
        const age = (t + hash(i, 2) * 10) % life;
        const k = age / life;
        const x = FX + (hash(i, 3) - 0.5) * 8 + Math.sin(age * 3 + i) * 3 * k + (fbm1(t * 0.7, 5) - 0.5) * 10 * k;
        const y = -6 - age * (14 + hash(i, 4) * 16);
        const c: [number, number, number] = k < 0.4 ? [1, 0.85, 0.4] : k < 0.75 ? [1, 0.5, 0.15] : [0.8, 0.2, 0.08];
        r.dot(x, y, FZ + (hash(i, 5) - 0.5) * 6, c, { emissive: 2.2 * (1 - k), alpha: 1 });
      }
    },
  };
};
