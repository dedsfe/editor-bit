// Figurantes de multidão: dois desenhos (homem e mulher) e várias paletas.
// Figurante novo = uma linha na lista FIGURANTES.
import type { Skin } from "./types";
import type { Palette, RGB } from "../core/pixels";

const HOMEM = {
  head: [
    ".....KKKKKKK........",
    "....KKBBBBBKK.......",
    "....KSSSSSSSK.......",
    "....KSSSSSSSK.......",
    "....KSSESSSESK......",
    "....KSSSSSSSSK......",
    "....KhhhSShhhK......",
    ".....hhhhhhhh.......",
    "......hhhhhh........",
  ],
  body: [
    "......TSSST.........",
    "....TTTTTTTTTTT.....",
    "...TTTTTTTTTTTTT....",
    "...TtTTTTTTTTTtT....",
    "...StTTTTTTTTTtS....",
    "....TLLLLLLLLLT.....",
    "....TTTTTTTTTTT.....",
    "....TTTTTtTTTTT.....",
    "....TTTTTtTTTTT.....",
    "....TTTTTtTTTTT.....",
    "....TTTTTtTTTTT.....",
    "....ttttttttttt.....",
  ],
};

const MULHER = {
  head: [
    "......KKKKKK........",
    ".....KKKKKKKK.......",
    "....KKSSSSSSKK......",
    "....KSSSSSSSSK......",
    "....KSSESSSESK......",
    "....KSSSSSSSSK......",
    "....KSSSSSSSSK......",
    "....KKSSSSSSKK......",
    "...KKKKKKKKKKKK.....",
  ],
  body: [
    "...KKTTTTTTTTKK.....",
    "...KTTTTTTTTTTK.....",
    "...KTTTTTTTTTTK.....",
    "...STTTTTTTTTTS.....",
    "....TTTTLLTTTT......",
    "....TTTTTTTTTT......",
    "....TTTTTtTTTT......",
    "....TTTTTtTTTT......",
    "...TTTTTTtTTTTT.....",
    "...TTTTTTtTTTTT.....",
    "...TTTTTTtTTTTT.....",
    "...ttttttttttttt....",
  ],
};

interface Look { id: string; name: string; base: typeof HOMEM; cloth: RGB; band: RGB; tunic: RGB; skin: RGB; beard?: RGB }

const FIGURANTES: Look[] = [
  { id: "figurante-1", name: "Figurante (homem, bege)", base: HOMEM, cloth: [222, 210, 180], band: [60, 90, 140], tunic: [140, 110, 76], skin: [214, 162, 116], beard: [60, 44, 30] },
  { id: "figurante-2", name: "Figurante (homem, verde)", base: HOMEM, cloth: [190, 170, 130], band: [140, 50, 40], tunic: [88, 112, 70], skin: [176, 122, 84], beard: [40, 30, 22] },
  { id: "figurante-3", name: "Figurante (homem, velho)", base: HOMEM, cloth: [236, 232, 220], band: [120, 100, 60], tunic: [120, 96, 120], skin: [200, 150, 110], beard: [200, 196, 188] },
  { id: "figurante-4", name: "Figurante (mulher, azul)", base: MULHER, cloth: [70, 100, 150], band: [70, 100, 150], tunic: [170, 150, 120], skin: [222, 172, 128] },
  { id: "figurante-5", name: "Figurante (mulher, vermelho)", base: MULHER, cloth: [150, 60, 50], band: [150, 60, 50], tunic: [200, 180, 140], skin: [190, 136, 96] },
  { id: "figurante-6", name: "Figurante (mulher, creme)", base: MULHER, cloth: [226, 214, 186], band: [226, 214, 186], tunic: [110, 90, 70], skin: [168, 116, 80] },
];

const darker = (c: RGB, k = 0.72): RGB => [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)];

function figurante(f: Look): Skin {
  const palette: Palette = {
    K: f.cloth, B: f.band, S: f.skin, E: [26, 16, 12], M: [40, 12, 14],
    h: f.beard ?? darker(f.skin, 0.5), T: f.tunic, t: darker(f.tunic), L: darker(f.tunic, 0.5), D: [74, 46, 23],
  };
  return {
    id: f.id, name: f.name, w: 20, h: 23, scale: 2, color: "#dddddd", palette,
    parts: [
      { name: "corpo", follows: "body", at: [0, 9], grid: f.base.body },
      { name: "cabeça", follows: "head", at: [0, 0], grid: f.base.head },
    ],
    feet: {
      stand: [".....SS....SS.......", "....DDD...DDD......."],
      step: ["....SS......SS......", "...DDD......DDD....."],
      pass: ["......SSSS..........", ".....DDDDDD........."],
    },
    mouth: { half: [[8, 6], [9, 6]], open: [[8, 6], [9, 6], [8, 7], [9, 7]], color: "M" },
    eyes: { pixels: [[7, 4], [11, 4]], lid: "S" },
  };
}

export const figurantes: Record<string, Skin> = Object.fromEntries(FIGURANTES.map((f) => [f.id, figurante(f)]));
