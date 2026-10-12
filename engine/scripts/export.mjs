// Export determinístico: renderiza frame a frame no Chrome headless e manda pro ffmpeg com o áudio.
// Uso: npm run export -- <cena>   → out/<cena>.mp4 (1080×1920, 30 fps)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { openBrowser, ENGINE } from "./browser.mjs";
import { build } from "./build.mjs";

const id = process.argv[2] ?? "mvp-fogueira";
const { json, audioOut } = await build(id);
const frames = Math.ceil(json.duration * json.fps);
mkdirSync(join(ENGINE, "out"), { recursive: true });
const mp4 = join(ENGINE, "out", `${id}.mp4`);

const { page, url, close } = await openBrowser();
await page.goto(url(`scene=${id}&export=1`));
await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
const [w, h] = await page.evaluate(() => [document.querySelector("canvas").width, document.querySelector("canvas").height]);

const ff = spawn("ffmpeg", [
  "-y", "-v", "error",
  "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-r", String(json.fps), "-i", "-",
  "-i", audioOut,
  "-vf", `vflip,scale=${w * 6}:${h * 6}:flags=neighbor`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", mp4,
], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((ok, fail) => ff.on("close", (c) => (c === 0 ? ok() : fail(new Error(`ffmpeg saiu com ${c}`)))));

const BATCH = 15;
for (let f = 0; f < frames; f += BATCH) {
  const n = Math.min(BATCH, frames - f);
  const b64 = await page.evaluate(([f, n]) => window.__frames(f, n), [f, n]);
  if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
  process.stdout.write(`\r${id}: frame ${f + n}/${frames}`);
}
ff.stdin.end();
await done;
await close();
console.log(`\n${mp4}`);
