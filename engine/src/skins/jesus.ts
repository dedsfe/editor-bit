// Jesus, portado de design/animate.py e separado em camadas.
import type { Skin } from "./types";

export const jesus: Skin = {
  id: "jesus",
  name: "Jesus",
  w: 20,
  h: 23,
  scale: 2,
  color: "#ffe9a8",
  palette: {
    H: [107, 68, 35], S: [242, 201, 160], s: [176, 128, 96], E: [40, 24, 14], M: [34, 10, 14],
    W: [250, 248, 240], R: [215, 38, 61], L: [90, 58, 30],
    T: [122, 78, 42], D: [74, 46, 23],
  },
  parts: [
    {
      name: "cajado", follows: "prop", at: [0, 6],
      grid: [
        ".TT.", "T..T", "T..T",
        ...Array.from({ length: 14 }, () => "...T"),
      ],
    },
    {
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        ".......WSSWW........",
        ".....WWRRWWWWWW.....",
        "....WWWRRRWWWWWW....",
        "....WWWWRRRWWWWW....",
        "....WWWWWRRRWWWWS...",
        ".....WLLLLLLLLLW....",
        ".....WWWWWWRRRWW....",
        ".....WWWWWWWRRRW....",
        ".....WWWWWWWRRRR....",
        ".....WWWWWWWWRRR....",
        ".....WWWWWWWWRRR....",
        ".....WWWWWWWWWRR....",
      ],
    },
    {
      name: "cabeça", follows: "head", at: [0, 0],
      grid: [
        "......HHHHHH........",
        ".....HHHHHHHH.......",
        "....HHHSSSSSHH......",
        "....HHSSSSSSSH......",
        "....HSSESSSESH......",
        "....HSSSSSSSSHH.....",
        "....HHHHSSHHHHH.....",
        "....HHHHHHHHHHH.....",
        "......HHHHHHH.......",
      ],
    },
    { name: "mão", follows: "prop", at: [3, 12], grid: ["S"] },
  ],
  variants: {
    // de joelhos orando, olhos fechados e mãos juntas no peito (sem cajado)
    kneel: [
      { name: "cajado", follows: "static", at: [0, 0], grid: [] },
      { name: "mão", follows: "static", at: [0, 0], grid: [] },
      { name: "pés", follows: "static", at: [0, 0], grid: [] },
      {
        name: "corpo", follows: "body", at: [0, 14],
        grid: [
          ".......WSSWW........",
          ".....WWRRWWWWWW.....",
          "....WWWRRRSSWWWW....",
          "....WWWWRRSSWWWW....",
          ".....WLLLLLLLLLW....",
          "....WWWWWWRRRWWWW...",
          "...WWWWWWWWRRRWWWW..",
          "..WWWWWWWWWWWRRWWWW.",
          ".DDWWWWWWWWWWWWWWWW.",
        ],
      },
    ],
    // braço direito esticado (estender a mão / segurar alguém)
    reach: [
      {
        name: "corpo", follows: "body", at: [0, 9],
        grid: [
          ".......WSSWW........",
          ".....WWRRWWWWWW.....",
          "....WWWRRRWWWWWWWWSS",
          "....WWWWRRRWWWWW....",
          "....WWWWWRRRWWWW....",
          ".....WLLLLLLLLLW....",
          ".....WWWWWWRRRWW....",
          ".....WWWWWWWRRRW....",
          ".....WWWWWWWRRRR....",
          ".....WWWWWWWWRRR....",
          ".....WWWWWWWWRRR....",
          ".....WWWWWWWWWRR....",
        ],
      },
    ],
  },
  poses: { kneel: { dy: 5, eyesClosed: true } },
  feet: {
    stand: ["......SS....SS......", ".....DDD...DDD......"],
    step: [".....SS......SS.....", "....DDD......DDD...."],
    pass: [".......SSSS.........", "......DDDDDD........"],
  },
  mouth: { half: [[8, 6], [9, 6]], open: [[8, 6], [9, 6], [8, 7], [9, 7]], color: "M" },
  eyes: { pixels: [[7, 4], [11, 4]], lid: "S", closed: "s" },
};
