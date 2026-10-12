// Folha de sprites sem luz: cada skin em repouso, boca aberta, piscando, andando e com cada gesto.
// Uso: node scripts/run-ts.mjs ./scripts/skin-sheet.ts  → out/skins.rgba (convertido pra PNG pelo ffmpeg)
import { writeFileSync } from "node:fs";
import { SKINS } from "../src/skins";
import { composeSkin, REST, type Pose } from "../src/skins/animate";

const poses: Pose[] = [
  REST, { ...REST, mouth: 2 }, { ...REST, blink: true },
  { ...REST, feet: "step", bob: 1, propDx: 1 }, { ...REST, variant: "reach" },
];
const skins = Object.values(SKINS);
const cw = 24, ch = 26, cols = poses.length, rows = skins.length;
const W = cw * cols, H = ch * rows;
const data = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) data.set([40, 40, 52, 255], i * 4);
skins.forEach((s, r) =>
  poses.forEach((p, c) =>
    composeSkin(s, p).forEach((row, y) =>
      [...row].forEach((ch_, x) => {
        const col = s.palette[ch_];
        if (col) data.set([...col, 255], ((r * ch + 2 + y) * W + c * cw + 2 + x) * 4);
      }))));
writeFileSync("out/skins.rgba", data);
writeFileSync("out/skins.size", `${W}x${H}`);
