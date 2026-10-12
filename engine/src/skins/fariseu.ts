// Fariseu: roupa chique (manto escarlate sobre túnica azul, cinto e barra douradas largas),
// turbante branco com faixa dourada, filactério (caixinha preta) na testa, borlas azuis e brancas
// nas pontas da roupa (Mt 23:5) e barba aparada em ponta. Nariz pra cima: postura de quem se acha.
// Gesto "pray": orando em pé com os braços abertos pro alto, pro público ver.
import type { Skin } from "./types";

const HEAD = [
  "......TTTTTT........",
  ".....TTGGGGTT.......",
  "....tTTTKKTTTt......",
  "....tHSSSSSSHt......",
  "....HSSESSSESH......",
  "....HSSSSSSSSSS.....",
  "....HHSSSSSSHH......",
  ".....HHHHHHHHH......",
  "......HHHHHHH.......",
  ".......HHHHH........",
];

export const fariseu: Skin = {
  id: "fariseu",
  name: "Fariseu",
  w: 20,
  h: 23,
  scale: 2,
  color: "#9fc4ff",
  palette: {
    T: [238, 234, 222], t: [192, 186, 172], G: [236, 192, 64], K: [22, 18, 18], H: [44, 32, 26],
    S: [214, 166, 120], E: [26, 16, 12], M: [40, 10, 14],
    R: [196, 32, 52], r: [138, 20, 38], B: [42, 74, 168], b: [30, 52, 124], q: [80, 130, 230], w: [244, 244, 236], D: [96, 58, 30],
  },
  parts: [
    {
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        ".......BSSSB........",
        ".....RRRBBBRRR......",
        "....RRRRBBBRRRR.....",
        "....RRRBBBBBRRR.....",
        "....SRRBBBBBRRS.....",
        ".....rGGGGGGGr......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....GGGGGGGGG......",
        "....qw.......wq.....",
      ],
    },
    { name: "cabeça", follows: "head", at: [0, 0], grid: HEAD },
  ],
  variants: {
    pray: [{
      name: "corpo", follows: "body", at: [0, 7],
      grid: [
        "S.................S.",
        "SR...............RS.",
        ".RR....BSSSB....RR..",
        "..RRRRRRBBBRRRRRR...",
        "....RRRRBBBRRRR.....",
        "....RRRBBBBBRRR.....",
        ".....RRBBBBBRR......",
        ".....rGGGGGGGr......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....GGGGGGGGG......",
        "....qw.......wq.....",
      ],
    }],
    reach: [{
      name: "corpo", follows: "body", at: [0, 9],
      grid: [
        ".......BSSSB........",
        ".....RRRBBBRRR......",
        "....RRRRBBBRRRRRRRSS",
        "....RRRBBBBBRRR.....",
        "....SRRBBBBBRR......",
        ".....rGGGGGGGr......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....BBbBBBBbB......",
        ".....GGGGGGGGG......",
        "....qw.......wq.....",
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
