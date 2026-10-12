// Confere uma cena e gera a folha de frames: npm run check -- <id> [n de frames]
// 1) valida o JSON (falas, personagens, cues, tempos, regras)  2) monta a linha do tempo
// 3) renderiza frames espalhados (cada fala + cards) → out/<id>-check.png, com o tempo escrito em cada um
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "vite";
import { build, loadScene, loadSounds, ROOT } from "./build.mjs";
import { openBrowser, ENGINE } from "./browser.mjs";

const id = process.argv[2];
if (!id) { console.error("uso: npm run check -- <id>"); process.exit(2); }
const scene = await loadScene(id);
const sources = readdirSync(join(ROOT, scene.audio)).map((f) => f.replace(/\.[^.]+$/, ""));

const vite = await createServer({ root: ENGINE, server: { middlewareMode: true }, logLevel: "error", appType: "custom" });
const load = (p) => vite.ssrLoadModule(p);
const [{ validate }, { SETS }, { SKINS }] = await Promise.all([load("/src/scene/validate.ts"), load("/src/sets/index.ts"), load("/src/skins/index.ts")]);
const ctx = { sets: Object.keys(SETS), skins: SKINS, sources, sounds: loadSounds().map((s) => s.id) };

let report = validate(scene, ctx);
let json;
if (!report.errors.length) {
  ({ json } = await build(id, scene));
  report = validate(scene, { ...ctx, build: json });
}
await vite.close();

for (const e of report.errors) console.log(`✗ ${e}`);
for (const w of report.warnings) console.log(`! ${w}`);
if (report.errors.length) { console.log(`\n${report.errors.length} erro(s): corrija antes de exportar.`); process.exit(1); }
console.log(`✓ ${id}: ${scene.lines.length} falas, ${(scene.cues ?? []).length} cues, ${json.duration.toFixed(1)} s${report.warnings.length ? `, ${report.warnings.length} aviso(s)` : ""}`);

// tempos da folha: começo, meio da voz de cada fala, cada card, e o fim
const times = new Set([Math.min(1.5, json.duration / 2)]);
for (const l of json.lines) times.add((l.voiceStart + l.voiceEnd) / 2);
const cards = (scene.cues ?? []).filter((c) => c.type === "card" || c.type === "hook");
const { page, url, close } = await openBrowser();
await page.goto(url(`scene=${id}&export=1`));
await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
for (const c of cards) {
  const t = await page.evaluate((at) => window.__time?.(at), c.at);
  if (Number.isFinite(t)) times.add(t + 0.6);
}
times.add(json.duration - 0.3);
const list = [...times].filter((t) => t >= 0 && t < json.duration).sort((a, b) => a - b);
const frames = [];
for (const t of list) frames.push(Buffer.from(await page.evaluate(([f]) => window.__frames(f, 1, true), [Math.round(t * json.fps)]), "base64"));
await close();

const cols = 6, rows = Math.ceil(frames.length / cols);
while (frames.length < cols * rows) frames.push(Buffer.alloc(180 * 320 * 4));
const out = join(ENGINE, "out", `${id}-check.png`);
const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "180x320", "-i", "-",
  "-vf", `vflip,scale=360:640:flags=neighbor,tile=${cols}x${rows}:padding=6:color=0x0a0a0e`, "-frames:v", "1", out], { input: Buffer.concat(frames) });
if (r.status !== 0) throw new Error(String(r.stderr));
console.log(`folha: ${out} (${list.length} frames: ${list.map((t) => t.toFixed(1)).join(", ")})`);
