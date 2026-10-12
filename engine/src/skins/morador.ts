// Morador de Jericó (o fofoqueiro): gente simples, pano na cabeça, túnica cinza-azulada, barba grisalha.
import type { Skin } from "./types";

export const morador: Skin = {
  id: "morador",
  name: "Morador",
  w: 20,
  h: 23,
  scale: 2,
  color: "#a8d8ff",
  palette: {
    K: [214, 200, 168], B: [150, 70, 50], H: [70, 54, 40], S: [206, 156, 112], E: [26, 16, 12], M: [36, 10, 14],
    h: [118, 108, 98], T: [92, 108, 124], t: [66, 78, 92], L: [120, 84, 48], D: [74, 46, 23],
  },
  parts: [
    {
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
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
    },
    {
      name: "cabeça", follows: "head", at: [0, 0],
      grid: [
        ".....KKKKKKK........",
        "....KKBBBBBKK.......",
        "....KHSSSSSHK.......",
        "....KSSSSSSSK.......",
        "....KSSESSSESK......",
        "....KSSSSSSSSK......",
        "....KhhhSShhhK......",
        "....KhhhhhhhhK......",
        ".....hhhhhhhh.......",
      ],
    },
  ],
  variants: {
    // apontando / braço esticado
    reach: [{
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        "......TSSST.........",
        "....TTTTTTTTTTT.....",
        "...TTTTTTTTTTTTTTTSS",
        "...TtTTTTTTTTTtTT...",
        "...StTTTTTTTTTt.....",
        "....TLLLLLLLLLT.....",
        "....TTTTTTTTTTT.....",
        "....TTTTTtTTTTT.....",
        "....TTTTTtTTTTT.....",
        "....TTTTTtTTTTT.....",
        "....TTTTTtTTTTT.....",
        "....ttttttttttt.....",
      ],
    }],
  },
  feet: {
    stand: [".....SS....SS.......", "....DDD...DDD......."],
    step: ["....SS......SS......", "...DDD......DDD....."],
    pass: ["......SSSS..........", ".....DDDDDD........."],
  },
  mouth: { half: [[8, 6], [9, 6]], open: [[8, 6], [9, 6], [8, 7], [9, 7]], color: "M" },
  eyes: { pixels: [[7, 4], [11, 4]], lid: "S" },
};
