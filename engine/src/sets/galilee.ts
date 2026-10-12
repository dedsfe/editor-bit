// Cenário: mar da Galileia. O clima vem da timeline (scene.weather + cues "weather"/"lightning"):
//   waves → tamanho das ondas e balanço do barco    wind → nuvens e inclinação do barco
//   daylight → noite (0) até amanhecer (1)           swell → onda gigante subindo
// Parâmetros fixos: boatX, boatZ (barco), waveX, waveZ (onde a onda gigante sobe).
import type { SetFactory, Drawable, Surface } from "./types";
import { paint } from "./types";
import { hash, noise2, fbm1, fbm2 } from "../core/noise";
import { normalMap, type Grid, type RGB } from "../core/pixels";
import type { Light } from "../core/renderer";
import type { Env } from "../scene/timeline";

const FLOOR_Y = 196;
const HORIZON = FLOOR_Y - 30; // topo da água
const W0 = -70, WW = 320;

type C = [number, number, number];
const mix = (a: C, b: C, k: number): C => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const SKY_STORM: C[] = [[16, 11, 34], [26, 18, 52], [38, 28, 72], [50, 40, 92], [60, 50, 104]];
const SKY_DAWN: C[] = [[44, 62, 124], [92, 96, 156], [168, 128, 156], [236, 156, 122], [255, 204, 130]];
const SEA_STORM: C[] = [[9, 15, 32], [13, 24, 48], [20, 38, 66], [34, 58, 92]];
const SEA_DAWN: C[] = [[36, 50, 88], [58, 74, 116], [104, 104, 140], [196, 150, 140]];
const FOAM: C = [178, 202, 220];

export const galilee: SetFactory = (r, params, ctx) => {
  const BX = (params.boatX as number) ?? 55, BZ = (params.boatZ as number) ?? 40;
  const WX = (params.waveX as number) ?? 20, WZ = (params.waveZ as number) ?? -8;
  let env: Env = { flash: 0, strikes: [] };
  const waves = () => env.waves ?? 1;
  const wind = () => env.wind ?? 1;
  const dawn = () => env.daylight ?? 0;

  // ---- céu (cacheado por nível de amanhecer)
  const skyCache = new Map<number, WebGLTexture>();
  const skyTex = (d: number) => {
    const key = Math.round(d * 24);
    let tex = skyCache.get(key);
    if (!tex) {
      const k = key / 24;
      tex = r.texture(paint(r.w, HORIZON + 6, (x, y) => {
        const band = Math.min(4, Math.floor((y / (HORIZON + 6)) * 5));
        if (k > 0.5 && hash(x, y, 5) > 0.996 && y < 90) return [255, 240, 220];
        return mix(SKY_STORM[band], SKY_DAWN[band], k);
      }));
      skyCache.set(key, tex);
    }
    return tex;
  };

  // ---- nuvens de tempestade (duas camadas de parallax)
  const cloudLayer = (seed: number, cut: number) => r.texture(paint(WW, 120, (x, y) => {
    const v = fbm2(x / 38, y / 16, seed) - (y / 120) * 0.25;
    if (v < cut) return null;
    const c: C = v > cut + 0.16 ? [86, 72, 126] : v > cut + 0.07 ? [56, 44, 90] : [36, 28, 64];
    return c;
  }));
  const cloudsFar = cloudLayer(3, 0.48), cloudsNear = cloudLayer(9, 0.53);

  // ---- mar: altura das ondas (mesma função pro desenho, pro normal map e pra quem pisa na água)
  const amp = () => 0.3 + 1.7 * waves();
  const waveH = (x: number, Z: number, t: number) => {
    const a = amp();
    const zw = Math.sqrt(Math.max(Z + 70, 0)) * 12; // perspectiva: perto da câmera as ondas são maiores
    const s = Math.max(0.35, Math.min(1, (Z + 70) / 260));
    return a * (
      Math.sin(zw * 0.32 - t * 2.1 + Math.sin(x * 0.04 / s + t * 0.4) * 1.8) * 0.6 +
      Math.sin(x * 0.1 / s + zw * 0.15 + t * 1.3) * 0.2 +
      (noise2(x * 0.07 / s - t * 0.6, zw * 0.25, 4) - 0.5) * 0.55);
  };
  const SW = WW, SH = r.h - HORIZON + 40;
  const seaBmp = { w: SW, h: SH, data: new Uint8Array(SW * SH * 4) };
  const seaNrm = { w: SW, h: SH, data: new Uint8Array(SW * SH * 4) };
  const hgt = new Float32Array(SW * SH);
  const seaTex = r.texture(seaBmp), seaNTex = r.texture(seaNrm);
  const updateSea = (t: number) => {
    const a = amp(), d = dawn(), st = waves();
    const pal = SEA_STORM.map((c, i) => mix(c, SEA_DAWN[i], d));
    for (let y = 0; y < SH; y++) {
      const Z = (HORIZON + y - FLOOR_Y) / r.depthScale;
      for (let x = 0; x < SW; x++) hgt[y * SW + x] = waveH(W0 + x, Z, t);
    }
    for (let y = 0; y < SH; y++)
      for (let x = 0; x < SW; x++) {
        const i = y * SW + x, h = hgt[i] / a;
        let c = pal[Math.max(0, Math.min(3, Math.floor((h + 0.9) * 2.2)))];
        if (h > 0.68 && hash(x, y, Math.floor(t * 8)) < 0.15 + st * 0.35) c = FOAM; // espuma só na crista
        seaBmp.data.set([c[0], c[1], c[2], 255], i * 4);
        const gx = (hgt[y * SW + Math.min(SW - 1, x + 1)] - hgt[y * SW + Math.max(0, x - 1)]) * 0.9;
        const gz = (hgt[Math.min(SH - 1, y + 1) * SW + x] - hgt[Math.max(0, y - 1) * SW + x]) * 0.9;
        const len = Math.hypot(gx, gz, 1);
        seaNrm.data.set([(-gx / len * 0.5 + 0.5) * 255, (-gz / len * 0.5 + 0.5) * 255, (1 / len * 0.5 + 0.5) * 255, 255], i * 4);
      }
    r.update(seaTex, seaBmp);
    r.update(seaNTex, seaNrm);
  };

  // ---- barco (casco com 7 inclinações) e mastro
  const HULL_W = 66, HULL_H = 26;
  const hullGrid = (tilt: number): Grid => Array.from({ length: HULL_H }, (_, y) => Array.from({ length: HULL_W }, (_, x) => {
    const yy = y - 3 - Math.round((x - 33) * tilt);
    const top = x > 54 ? 6 - (x - 54) * 0.55 : x < 8 ? 6 - (8 - x) * 0.4 : 6;
    const bottom = 6 + 15 * Math.sqrt(Math.max(0, 1 - ((x - 33) / 34) ** 2));
    if (yy < Math.round(top) || yy > bottom) return ".";
    if (yy <= Math.round(top) + 1) return yy === Math.round(top) ? "r" : "k";
    if (yy > bottom - 1.2) return "k";
    return Math.floor((yy - top) / 3) % 2 ? "v" : "w";
  }).join(""));
  const hullPal: Record<string, C> = { r: [160, 110, 62], k: [64, 38, 20], w: [124, 80, 44], v: [96, 60, 32] };
  const TILTS = [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06];
  const hulls = TILTS.map((tl) => {
    const g = hullGrid(tl);
    return {
      tex: r.texture(paint(HULL_W, HULL_H, (x, y) => hullPal[g[y][x]] ?? null)),
      n: r.texture(normalMap(g, { radius: 3, strength: 2, materialEdges: 0.25 })),
    };
  });
  const MAST: Grid = Array.from({ length: 84 }, (_, y) => Array.from({ length: 42 }, (_, x) => {
    if (x >= 20 && x <= 21 && y >= 4) return x === 20 ? "p" : "q";
    if (y >= 7 && y <= 8 && x >= 3 && x <= 38) return "p";
    if (y >= 9 && y <= 12 && x >= 5 && x <= 36 && hash(x >> 2, y, 3) > 0.15 - (y - 9) * 0.1) return y === 12 ? "t" : "s";
    return ".";
  }).join(""));
  const mastPal: Record<string, C> = { p: [104, 68, 36], q: [74, 46, 24], s: [196, 182, 150], t: [150, 136, 108] };
  const mast = { tex: r.texture(paint(42, 84, (x, y) => mastPal[MAST[y][x]] ?? null)), n: r.texture(normalMap(MAST, { radius: 2 })) };

  // lampião pendurado na popa do barco
  const LAMP = r.texture(paint(3, 5, (x, y) => (y === 0 ? (x === 1 ? [60, 40, 20] : null) : y === 4 ? [80, 50, 24] : x === 1 ? [255, 236, 170] : [255, 170, 70])));
  const lantern = (t: number) => ({ x: BX - 27, y: -(boatBob(t) + 22), z: BZ + 3 });
  const boatBob = (t: number) => Math.sin(t * 1.7) * 2 * (0.3 + waves()) + 1;
  const boatTilt = (t: number) => Math.sin(t * 1.3 + 0.5) * 0.06 * Math.min(1, 0.25 + 0.45 * waves() + 0.3 * wind());

  // ---- onda gigante
  const WAVE_W = 120, WAVE_H = 74;
  const WAVE: Grid = Array.from({ length: WAVE_H }, (_, y) => Array.from({ length: WAVE_W }, (_, x) => {
    const peak = 64 * Math.exp(-(((x - 70) / 30) ** 2)) + 10 * Math.exp(-(((x - 30) / 18) ** 2));
    const lip = x > 46 && x < 64 && y > WAVE_H - peak - 6 && y < WAVE_H - peak + 2 ? 1 : 0; // crista enrolando
    const top = WAVE_H - peak;
    if (y < top - lip * 4) return ".";
    const d = y - top;
    if (d < 3 || (lip && hash(x, y, 2) > 0.3)) return "f";
    if (d < 9 && hash(x, y >> 1, 4) > 0.55) return "c";
    return d < 20 ? "b" : "a";
  }).join(""));
  const wavePal: Record<string, C> = { f: [214, 228, 240], c: [90, 136, 172], b: [46, 84, 124], a: [24, 46, 80] };
  const bigWave = { tex: r.texture(paint(WAVE_W, WAVE_H, (x, y) => wavePal[WAVE[y][x]] ?? null)), n: r.texture(normalMap(WAVE, { radius: 4, strength: 2 })) };

  const SUN = r.texture(paint(17, 17, (x, y) => (Math.hypot(x - 8, y - 8) <= 8.2 ? [255, 226, 160] : null)));

  return {
    floorY: FLOOR_Y,
    look: {
      fogNear: 20, fogFar: -50, fogMax: 0.6,
      bloom: 1, bloomThreshold: 0.8,
    },

    setEnv(e) { env = e; },

    lights(t): Light[] {
      const f = env.flash, d = dawn();
      const look = r.look;
      look.ambient = mix([0.1, 0.1, 0.18], [0.34, 0.3, 0.32], d) as RGB;
      look.fogColor = mix([0.11, 0.09, 0.2], [0.78, 0.58, 0.52], d) as RGB;
      const bolt = env.strikes[0];
      look.rays = d > 0.05
        ? { x: 148, y: HORIZON - 6 - d * 14, strength: d * 0.8, decay: 0.95, parallax: 0.05 }
        : { x: bolt !== undefined ? 40 + hash(Math.round(bolt * 100), 1) * 100 : 90, y: 40, strength: f * 0.6, decay: 0.93, parallax: 0 };
      return [
        { x: -0.4, y: -1, z: 0.3, radius: 0, color: [0.5, 0.56, 1], intensity: 0.8 * (1 - d), directional: true, castShadows: false },
        { ...lantern(t), radius: 78, color: [1, 0.66, 0.3], intensity: (1.1 + fbm1(t * 6, 3) * 0.4) * (1 - d * 0.8), castShadows: false },
        { x: 0.7, y: -0.35, z: -0.3, radius: 0, color: [1, 0.72, 0.46], intensity: d * 1.2, directional: true, castShadows: false },
      ];
    },

    back(t) {
      const f = env.flash, d = dawn();
      r.unlit(skyTex(d), { x: 0, y: 0, w: r.w, h: HORIZON + 6 }, { parallax: 0, emissive: f * 1.2 });
      if (d > 0) {
        const sy = HORIZON + 4 - d * 22;
        r.unlit(SUN, { x: 140, y: sy, w: 17, h: 17 }, { parallax: 0.05, emissive: 1.5 * d, tint: [1, 1, 1, Math.min(1, d * 2)], anchorY: HORIZON });
      }
      const ca = 1 - d * 0.85, ct: [number, number, number, number] = [1 + d * 0.9, 1 + d * 0.5, 1 + d * 0.2, ca];
      const drift = (t * (2 + 6 * wind())) % WW;
      for (const [layer, p, sp, y] of [[cloudsFar, 0.08, 0.5, -6], [cloudsNear, 0.15, 1, 4]] as const) {
        const ox = W0 - ((drift * sp) % WW);
        for (const dx of [0, WW]) r.unlit(layer, { x: ox + dx, y, w: WW, h: 120 }, { parallax: p, tint: ct, emissive: f * 1.4 });
      }
      ctx?.sky?.(t); // raio no céu, atrás do mar
      updateSea(t);
      r.floor(seaTex, { x: W0, y: HORIZON, w: SW, h: SH }, { normal: seaNTex, specular: 0.9 });
    },

    props(t): Drawable[] {
      const bob = boatBob(t), tilt = boatTilt(t);
      const ti = Math.round((tilt / 0.06) * 3) + 3;
      const items: Drawable[] = [
        { z: BZ - 2, draw: () => r.billboard(mast.tex, BX - 4, BZ - 2, 42, 84, { normal: mast.n, lift: bob }) },
        { z: BZ + 2.1, draw: () => { const l = lantern(t); const p = r.project(l.x, l.y, l.z); r.unlit(LAMP, { x: Math.round(p.x - 1), y: Math.round(p.y - 2), w: 3, h: 5 }, { emissive: 1.6 }); } },
        { z: BZ + 2, draw: () => r.billboard(hulls[ti].tex, BX, BZ + 2, HULL_W, HULL_H, { normal: hulls[ti].n, lift: bob - 4, specular: 0.25 }) },
      ];
      const k = env.swell ?? 0;
      if (k > 0.01) items.push({
        z: WZ, draw: () => r.billboard(bigWave.tex, WX, WZ, WAVE_W, WAVE_H, {
          normal: bigWave.n, sink: (1 - k) * WAVE_H, lift: Math.sin(t * 2) * 2, specular: 0.6, emissive: 0.12,
        }),
      });
      return items;
    },

    front() {},

    surface(x, z, t): Surface {
      if (Math.abs(x - BX) < 30 && Math.abs(z - BZ) < 6) return { lift: boatBob(t) - (x - BX) * boatTilt(t) + 1, water: false };
      return { lift: waveH(x, z, t) * 1.2, water: true };
    },
  };
};
