// Pedro: mais velho, barba escura e cheia com fios grisalhos, túnica marrom, corpo largo.
import type { Skin } from "./types";

export const pedro: Skin = {
  id: "pedro",
  name: "Pedro",
  w: 20,
  h: 23,
  scale: 2,
  color: "#ffc28a",
  palette: {
    H: [52, 40, 34], G: [128, 120, 112], S: [214, 160, 118], K: [36, 26, 22], E: [24, 16, 12],
    M: [30, 8, 10], B: [122, 80, 46], b: [88, 56, 32], L: [176, 146, 96], D: [70, 44, 24],
  },
  parts: [
    {
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        "......BSSSB.........",
        "....BBBBBBBBBBB.....",
        "...BBBBBBBBBBBBB....",
        "...BbBBBBBBBBBbB....",
        "...SbBBBBBBBBBbS....",
        "....BLLLLLLLLLB.....",
        "....BBBBBBBBBBB.....",
        "....BBBBBbBBBBB.....",
        "....BBBBBbBBBBB.....",
        "....BBBBBbBBBBB.....",
        "....BBBBBbBBBBB.....",
        "....bbbbbbbbbbb.....",
      ],
    },
    {
      // a barba cheia desce por cima do peito (rows 6–10)
      name: "cabeça", follows: "head", at: [0, 0],
      grid: [
        "......HHHHH.........",
        ".....HHGHHHH........",
        "....HHSSSSSHH.......",
        "....HKKSSSKKH.......",
        "....HSSESSSESH......",
        "....HSSSSSSSSH......",
        "...HHHHHSSHHHHH.....",
        "...HHHHHHHHHHHH.....",
        "...HHHGHHHHHGHH.....",
        "....HHHHHHHHHH......",
        ".....HHHGHHHH.......",
      ],
    },
  ],
  variants: {
    // braço direito esticado (estender a mão / pedir socorro)
    reach: [
      {
        name: "corpo", follows: "body", at: [0, 9],
        grid: [
          "......BSSSB.........",
          "....BBBBBBBBBBB.....",
          "...BBBBBBBBBBBBBBBSS",
          "...BbBBBBBBBBBbBB...",
          "...SbBBBBBBBBBb.....",
          "....BLLLLLLLLLB.....",
          "....BBBBBBBBBBB.....",
          "....BBBBBbBBBBB.....",
          "....BBBBBbBBBBB.....",
          "....BBBBBbBBBBB.....",
          "....BBBBBbBBBBB.....",
          "....bbbbbbbbbbb.....",
        ],
      },
    ],
  },
  feet: {
    stand: [".....SS....SS.......", "....DDD...DDD......."],
    step: ["....SS......SS......", "...DDD......DDD....."],
    pass: ["......SSSS..........", ".....DDDDDD........."],
  },
  mouth: { half: [[8, 6], [9, 6]], open: [[8, 6], [9, 6], [8, 7], [9, 7]], color: "M" },
  eyes: { pixels: [[7, 4], [11, 4]], lid: "S" },
};
