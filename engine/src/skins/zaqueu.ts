// Zaqueu: BAIXINHO (quadro 17 px de altura em vez de 23), rico: túnica roxa com detalhe dourado,
// turbante com faixa dourada, barba curta preta.
import type { Skin } from "./types";

export const zaqueu: Skin = {
  id: "zaqueu",
  name: "Zaqueu",
  w: 20,
  h: 17,
  scale: 2,
  color: "#e6b8ff",
  palette: {
    C: [120, 36, 110], G: [236, 192, 64], H: [36, 26, 20], S: [222, 170, 122], E: [26, 16, 12], M: [40, 10, 14],
    b: [40, 30, 24], P: [104, 40, 138], p: [74, 26, 100], L: [210, 160, 40], D: [92, 52, 26],
  },
  parts: [
    {
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        "....PGPPPPPPGP......",
        "...PPPGPPPPGPPP.....",
        "...SPpPPGGPPpPS.....",
        "....PLLLLLLLLP......",
        "....PPPPpPPPPP......",
        "....GGGGGGGGGG......",
      ],
    },
    {
      name: "cabeça", follows: "head", at: [0, 0],
      grid: [
        "......CCCCCC........",
        ".....CGGGGGGC.......",
        ".....HSSSSSSH.......",
        ".....SSSSSSSS.......",
        ".....SSESSSES.......",
        ".....SSSSSSSS.......",
        ".....SbbSSbbS.......",
        "......bbbbbb........",
        ".......SSSS.........",
      ],
    },
  ],
  variants: {
    reach: [{
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        "....PGPPPPPPGP......",
        "...PPPGPPPPGPPPPPPSS",
        "...SPpPPGGPPpP......",
        "....PLLLLLLLLP......",
        "....PPPPpPPPPP......",
        "....GGGGGGGGGG......",
      ],
    }],
  },
  feet: {
    stand: [".....SS...SS........", "....DDD...DDD......."],
    step: ["....SS.....SS.......", "...DDD.....DDD......"],
    pass: ["......SSSS..........", ".....DDDDDD........."],
  },
  mouth: { half: [[8, 6], [9, 6]], open: [[8, 6], [9, 6], [8, 7], [9, 7]], color: "M" },
  eyes: { pixels: [[7, 4], [11, 4]], lid: "S" },
};
