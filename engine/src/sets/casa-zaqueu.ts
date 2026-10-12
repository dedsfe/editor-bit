// Cenário: casa do Zaqueu à noite. Parede de reboco com prateleira e tapeçaria (casa de rico),
// janela em arco (alguém atrás da parede, em z < -12, aparece espiando por ela), mesa baixa com pão e
// a lamparina, que é a luz principal (quente, tremulando, com sombra no chão).
// Parâmetros: tableX, tableZ (mesa), windowX (janela).
import type { SetFactory, Drawable } from "./types";
import { paint } from "./types";
import { hash, fbm1, fbm2 } from "../core/noise";
import { normalMap, gridToBitmap, type Grid, type Palette } from "../core/pixels";
import type { Light } from "../core/renderer";

const FLOOR_Y = 212;
const WALL_Z = -12;
const WALL_W = 300, WALL_H = 190;

const grid = (w: number, h: number, f: (x: number, y: number) => string): Grid =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y)).join(""));

const WALL_PAL: Palette = {
  a: [178, 148, 108], b: [160, 130, 92], c: [196, 168, 126], s: [120, 104, 88], t: [100, 86, 72],
  k: [70, 44, 26], j: [96, 62, 36], f: [92, 60, 34], p: [120, 40, 110], q: [210, 168, 60], o: [150, 90, 50], y: [190, 150, 90],
};

export const casaZaqueu: SetFactory = (r, params) => {
  const TX = (params.tableX as number) ?? 92, TZ = (params.tableZ as number) ?? 30;
  const WX = (params.windowX as number) ?? 146;
  // janela em coordenadas do desenho da parede (parede centrada em x = 90)
  const wx = WX - 90 + WALL_W / 2, wy = WALL_H - 92, ww = 30, wh = 38;
  const inWindow = (x: number, y: number) => {
    const dx = x - wx;
    if (Math.abs(dx) > ww / 2 || y > wy + wh) return false;
    return y >= wy || Math.hypot(dx, (y - wy) * 1.3) < ww / 2; // topo em arco
  };

  const wallGrid = grid(WALL_W, WALL_H, (x, y) => {
    const fromFloor = WALL_H - y;
    if (inWindow(x, y)) return ".";
    if (inWindow(x - 2, y) || inWindow(x + 2, y) || inWindow(x, y + 2) || inWindow(x, y - 3)) return "f"; // moldura de madeira
    if (y < 10) return y % 9 === 8 ? "j" : "k"; // vigas do teto
    if (y < 16 && x % 26 < 5) return "j";
    if (fromFloor < 16) return fromFloor === 15 ? "t" : (Math.floor(x / 9) + Math.floor(y / 5)) % 2 ? "s" : "t"; // rodapé de pedra
    // prateleira com jarros (lado esquerdo)
    const sx = x - 40, sy = WALL_H - 110;
    if (sx > 0 && sx < 70 && y === sy) return "j";
    if (sx > 0 && sx < 70 && y > sy - 14 && y < sy) {
      const jar = Math.floor(sx / 14), jx = sx % 14 - 7, jy = sy - y;
      if (Math.abs(jx) < 4 - (jy > 10 ? 2 : 0)) return jar % 2 ? "o" : "y";
    }
    // tapeçaria roxa com barra dourada (casa de rico)
    const tx = x - 190, ty = y - 30;
    if (tx > 0 && tx < 44 && ty > 0 && ty < 64) return ty < 3 || ty > 60 || tx < 3 || tx > 40 ? "q" : (tx + ty) % 12 < 2 ? "q" : "p";
    const n = fbm2(x / 12, y / 12, 5);
    return n > 0.62 ? "c" : n < 0.38 ? "b" : "a";
  });
  const wall = { tex: r.texture(gridToBitmap(wallGrid, WALL_PAL)), n: r.texture(normalMap(wallGrid, { radius: 2, strength: 1.4, materialEdges: 0.35 })) };

  // céu da janela (atrás da parede)
  const night = r.texture(paint(60, 70, (x, y) => (hash(x, y, 4) > 0.97 ? [220, 226, 255] : y < 35 ? [14, 18, 44] : [20, 26, 56])));

  const floor = r.texture(paint(300, r.h - FLOOR_Y + 40, (x, y) => {
    const rug = Math.abs(x - (TX - 90 + 150)) < 46 && y > 14 && y < 46;
    if (rug) {
      const edge = Math.abs(x - (TX - 90 + 150)) > 42 || y < 18 || y > 42;
      return edge ? [200, 160, 60] : (x + y) % 8 < 2 ? [210, 170, 70] : [140, 36, 40];
    }
    const plank = Math.floor((y + (x % 40 < 20 ? 0 : 3)) / 6);
    const base: [number, number, number] = plank % 2 ? [110, 78, 50] : [100, 70, 44];
    return y % 6 === 0 || hash(x >> 3, plank, 2) > 0.94 ? [78, 54, 34] : base;
  }));

  const TABLE: Grid = [
    "..........BBB..............CC.........",
    ".........BBBBB............CCCC........",
    "....WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....",
    "...wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..",
    "....ll..........................ll....",
    "....ll..........................ll....",
    "....ll..........................ll....",
  ];
  const tablePal: Palette = { W: [140, 98, 60], w: [108, 72, 42], l: [90, 60, 36], B: [210, 160, 90], C: [170, 120, 80] };
  const table = { tex: r.texture(gridToBitmap(TABLE, tablePal)), n: r.texture(normalMap(TABLE, { radius: 1, strength: 2 })), w: TABLE[0].length, h: TABLE.length };
  const CUSHION: Grid = [".pppppppppp.", "pqpppppppqpp", "pppppppppppp", ".pppppppppp."];
  const cushion = { tex: r.texture(gridToBitmap(CUSHION, { p: [130, 40, 90], q: [210, 170, 70] })), n: r.texture(normalMap(CUSHION, { radius: 2 })) };
  // lamparina de barro + chama
  const lamp = r.texture(paint(7, 4, (x, y) => (y === 0 && x > 4 ? null : y < 3 ? (Math.abs(x - 3) < 3 + (y > 0 ? 1 : 0) ? [150, 96, 60] : null) : Math.abs(x - 3) < 2 ? [110, 70, 44] : null)));
  const flameBmp = (t: number) => paint(3, 6, (x, y) => {
    const f = Math.floor(t * 14), sway = Math.round((fbm1(t * 4, 2) - 0.5) * 2);
    const cx = 1 + (y < 3 ? sway : 0);
    if (x !== cx && !(y > 3 && Math.abs(x - 1) <= 1)) return null;
    if (y < 1 && hash(f, 3) > 0.5) return null;
    return y < 2 ? [255, 236, 170] : y < 4 ? [255, 190, 80] : [240, 120, 40];
  });
  const flame = r.texture(flameBmp(0));
  const lampX = TX + 4, lampY = -9, flick = (t: number) => fbm1(t * 6, 8) * 0.35 + Math.sin(t * 17) * 0.05;

  return {
    floorY: FLOOR_Y,
    look: {
      ambient: [0.06, 0.05, 0.07],
      fogColor: [0.05, 0.04, 0.05], fogNear: 0, fogFar: -40, fogMax: 0,
      bloom: 1, bloomThreshold: 0.8,
    },

    lights(t): Light[] {
      return [
        { x: lampX, y: lampY - 6, z: TZ + 3, radius: 170, color: [1, 0.66, 0.32], intensity: 1.35 + flick(t) },
        { x: lampX, y: -40, z: TZ - 20, radius: 120, color: [1, 0.55, 0.25], intensity: 0.35, castShadows: false },
        { x: -0.2, y: -0.6, z: 1, radius: 0, color: [0.4, 0.48, 0.9], intensity: 0.12, directional: true, castShadows: false },
      ];
    },

    back() {
      // céu da janela, depois a parede (com buraco) e o chão
      const p = r.project(WX, -(92 - 0) - 34, WALL_Z - 30);
      r.unlit(night, { x: Math.round(p.x - 30), y: Math.round(p.y - 20), w: 60, h: 70 });
      r.floor(floor, { x: -60, y: FLOOR_Y + WALL_Z * r.depthScale - 4, w: 300, h: r.h - FLOOR_Y + 40 });
    },

    props(t): Drawable[] {
      r.update(flame, flameBmp(t));
      return [
        { z: WALL_Z, draw: () => r.billboard(wall.tex, 90, WALL_Z, WALL_W, WALL_H, { normal: wall.n }) },
        { z: TZ - 6, draw: () => r.billboard(cushion.tex, TX - 26, TZ - 6, 24, 8, { normal: cushion.n }) },
        { z: TZ, draw: () => r.billboard(table.tex, TX, TZ, table.w, table.h, { normal: table.n }) },
        {
          z: TZ + 0.1, draw: () => {
            const p = r.project(lampX, -7, TZ + 0.1);
            r.unlit(lamp, { x: Math.round(p.x - 3), y: Math.round(p.y - 4), w: 7, h: 4 }, { emissive: 0.4 });
            r.unlit(flame, { x: Math.round(p.x + 1), y: Math.round(p.y - 9), w: 3, h: 6 }, { emissive: 2.2 });
          },
        },
        { z: TZ + 8, draw: () => r.billboard(cushion.tex, TX + 30, TZ + 8, 24, 8, { normal: cushion.n }) },
      ];
    },

    front() {},
  };
};
