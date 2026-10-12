// André: irmão mais novo do Pedro, barba curta, túnica bege/oliva, corpo mais magro.
import type { Skin } from "./types";

export const andre: Skin = {
  id: "andre",
  name: "André",
  w: 20,
  h: 23,
  scale: 2,
  color: "#d8e6a0",
  palette: {
    H: [92, 60, 34], h: [120, 82, 48], S: [228, 182, 140], E: [30, 20, 14], M: [36, 10, 14],
    O: [156, 146, 96], o: [116, 108, 66], L: [96, 64, 36], D: [74, 46, 23],
  },
  parts: [
    {
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        ".......OSSO.........",
        ".....OOOOOOOOO......",
        "....OOOOOOOOOOO.....",
        "....OoOOOOOOOoO.....",
        "....SoOOOOOOOoS.....",
        ".....OLLLLLLLO......",
        ".....OOOOOOOOO......",
        ".....OOOOoOOOO......",
        ".....OOOOoOOOO......",
        ".....OOOOoOOOO......",
        ".....OOOOoOOOO......",
        ".....ooooooooo......",
      ],
    },
    {
      name: "cabeça", follows: "head", at: [0, 0],
      grid: [
        "......HHHHHH........",
        ".....HHHHHHHH.......",
        ".....HSSSSSSH.......",
        ".....HSSSSSSS.......",
        ".....SSESSSES.......",
        ".....SSSSSSSS.......",
        ".....hhhSShhh.......",
        "......hhhhhh........",
        ".......SSSS.........",
      ],
    },
  ],
  variants: {
    reach: [
      {
        name: "corpo", follows: "body", at: [0, 9],
        grid: [
          ".......OSSO.........",
          ".....OOOOOOOOO......",
          "....OOOOOOOOOOOOOOSS",
          "....OoOOOOOOOoOO....",
          "....SoOOOOOOOo......",
          ".....OLLLLLLLO......",
          ".....OOOOOOOOO......",
          ".....OOOOoOOOO......",
          ".....OOOOoOOOO......",
          ".....OOOOoOOOO......",
          ".....OOOOoOOOO......",
          ".....ooooooooo......",
        ],
      },
    ],
  },
  feet: {
    stand: [".......SS..SS.......", "......DDD.DDD......."],
    step: ["......SS....SS......", ".....DDD....DDD....."],
    pass: [".......SSSS.........", "......DDDDDD........"],
  },
  mouth: { half: [[8, 6], [9, 6]], open: [[8, 6], [9, 6], [8, 7], [9, 7]], color: "M" },
  eyes: { pixels: [[7, 4], [11, 4]], lid: "S" },
};
