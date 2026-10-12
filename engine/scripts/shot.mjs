// Frames soltos em PNG (1080×1920) pra conferir sem abrir o navegador.
// Uso: npm run shot -- <cena> 0.5 3 6.2   → out/<cena>-<t>.png
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { openBrowser, ENGINE } from "./browser.mjs";

// --cam=x,y,zoom trava a câmera (bom pra conferir boca/rosto de perto)
const args = process.argv.slice(2);
const cam = args.find((a) => a.startsWith("--cam="))?.slice(6);
const [id = "mvp-fogueira", ...times] = args.filter((a) => !a.startsWith("--"));
const { page, url, close } = await openBrowser();
await page.goto(url(`scene=${id}&export=1${cam ? `&cam=${cam}` : ""}`));
await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
for (const t of times.length ? times : ["1"]) {
  const f = Math.round(Number(t) * 30);
  const b64 = await page.evaluate((f) => window.__frames(f, 1), f);
  const out = join(ENGINE, "out", `${id}-${t}.png`);
  spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "180x320", "-i", "-",
    "-vf", "vflip,scale=1080:1920:flags=neighbor", "-frames:v", "1", out], { input: Buffer.from(b64, "base64") });
  console.log(out);
}
await close();
