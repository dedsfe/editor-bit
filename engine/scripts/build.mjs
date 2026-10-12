// Lê os áudios da cena e monta a linha do tempo sozinho:
// duração de cada fala, onde a voz começa/termina, boca por frame (lip-sync) e o áudio mixado.
// A cena vem de projetos/<id>.json (o mesmo arquivo do editor) ou scenes/<id>.ts.
// Uso: npm run build -- <cena>
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { layout, FPS } from "../src/scene/layout.ts";
import { soundPlan, voiceRanges, DUCK_RAMP } from "../src/scene/sound.ts";

const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = resolve(ENGINE, "..");
const SR = 16000;
const EXTS = ["m4a", "wav", "mp3", "aac", "ogg", "flac", "aiff"];
const CACHE = join(ENGINE, "public", "build", "cache");

export async function loadScene(id) {
  const json = join(ROOT, "projetos", `${id}.json`);
  if (existsSync(json)) return JSON.parse(readFileSync(json, "utf8"));
  const mod = await import(pathToFileURL(join(ENGINE, "scenes", `${id}.ts`)).href);
  return mod.default;
}

export function audioFile(dir, source) {
  const ext = EXTS.find((e) => existsSync(join(ROOT, dir, `${source}.${e}`)));
  if (!ext) throw new Error(`falta o áudio ${dir}/${source}.(${EXTS.join("|")})`);
  return join(ROOT, dir, `${source}.${ext}`);
}

function decode(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-af", "highpass=f=250,lowpass=f=3500", "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg falhou em ${file}: ${r.stderr}`);
  const b = r.stdout;
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

function analyzeSamples(samples) {
  const hop = SR / FPS, n = Math.ceil(samples.length / hop);
  const rms = Array.from({ length: n }, (_, f) => {
    let s = 0, c = 0;
    const end = Math.min(Math.floor((f + 1) * hop), samples.length);
    for (let i = Math.floor(f * hop); i < end; i++, c++) s += samples[i] ** 2;
    return Math.sqrt(s / Math.max(c, 1));
  });
  const p95 = [...rms].sort((a, b) => a - b)[Math.floor(n * 0.95)] || 1e-6;
  const voiced = rms.map((v) => v > Math.max(0.01, p95 * 0.12));
  const first = voiced.indexOf(true), last = voiced.lastIndexOf(true);
  // RMS → 0/1/2 aberturas. Compara com o pico das sílabas vizinhas (±5 frames),
  // assim a boca abre no pico de cada sílaba e fecha entre elas, mesmo em fala com volume constante.
  let mouth = rms.map((v, i) => {
    if (!voiced[i]) return 0;
    let peak = 0;
    for (let j = Math.max(0, i - 5); j <= Math.min(n - 1, i + 5); j++) peak = Math.max(peak, rms[j]);
    const k = v / peak;
    return k > 0.82 ? 2 : k > 0.45 ? 1 : 0;
  });
  // tira "piscadas" de 1 frame da boca
  mouth = mouth.map((m, i) => (i > 0 && i < n - 1 && mouth[i - 1] === mouth[i + 1] && m !== mouth[i - 1] ? mouth[i - 1] : m));
  return {
    dur: +(samples.length / SR).toFixed(4),
    onset: first < 0 ? 0 : first / FPS,
    offset: last < 0 ? samples.length / SR : (last + 1) / FPS,
    mouth,
  };
}

/** Análise de um arquivo, cacheada por caminho + data + tamanho (trocar o áudio refaz sozinho). */
export function analyze(file) {
  const st = statSync(file);
  const key = `${file}|${st.mtimeMs}|${st.size}`.replace(/[^a-zA-Z0-9]/g, "_").slice(-150);
  const cached = join(CACHE, `${key}.json`);
  if (existsSync(cached)) return JSON.parse(readFileSync(cached, "utf8"));
  const a = analyzeSamples(decode(file));
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(cached, JSON.stringify(a));
  return a;
}

/** Análise de todos os áudios usados pela cena. */
export function analyzeScene(scene) {
  const out = {};
  for (const l of scene.lines) {
    const source = l.source ?? l.id;
    if (!out[source]) out[source] = analyze(audioFile(scene.audio, source));
  }
  return out;
}

/** Sons de sons/manifest.json (lista vazia se a biblioteca não existir). */
export function loadSounds() {
  const file = join(ROOT, "sons", "manifest.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
}

/** Filtros do ffmpeg pros sons (cue "sound"): loop, volume, fades, atraso e abaixar durante as falas. */
function soundChains(scene, build, first) {
  const plan = soundPlan(scene, build, loadSounds());
  const ranges = voiceRanges(build), R = DUCK_RAMP;
  const duckExpr = ranges.length
    ? ranges.map(([a, b]) => `clip(min((t-${a.toFixed(3)}+${R})/${R},(${b.toFixed(3)}+${R}-t)/${R}),0,1)`).reduce((acc, x) => `max(${acc},${x})`)
    : "0";
  const inputs = [], chains = [];
  plan.forEach((s, k) => {
    // loop: repete o arquivo, mas a entrada para no tamanho certo (sem `-t` o ffmpeg lê pra sempre e trava)
    inputs.push(...(s.loop ? ["-stream_loop", "-1"] : []), "-t", s.len.toFixed(3), "-i", join(ROOT, "sons", s.file));
    const len = s.len.toFixed(3), f = s.fade;
    chains.push(`[${first + k}:a]aresample=48000,aformat=channel_layouts=mono,atrim=0:${len},asetpts=PTS-STARTPTS,volume=${s.volume}` +
      (f > 0 ? `,afade=t=in:d=${f},afade=t=out:st=${(s.len - f).toFixed(3)}:d=${f}` : "") +
      `,adelay=${Math.round(s.start * 1000)}:all=1` +
      (s.duck < 1 ? `,volume='1-${(1 - s.duck).toFixed(3)}*${duckExpr}':eval=frame` : "") + `[s${k}]`);
  });
  return { inputs, chains, labels: plan.map((_, k) => `[s${k}]`) };
}

/** Mixa as falas (com corte e volume) e os sons num arquivo só, do tamanho da cena. */
export function mix(scene, build, out) {
  const snd = soundChains(scene, build, build.lines.length);
  if (!build.lines.length && !snd.labels.length) {
    const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", String(build.duration), "-c:a", "aac", out]);
    if (r.status !== 0) throw new Error(`áudio mudo falhou: ${r.stderr}`);
    return;
  }
  const inputs = [...build.lines.flatMap((l) => ["-i", audioFile(scene.audio, l.source)]), ...snd.inputs];
  const chains = build.lines.map((l, i) =>
    `[${i}:a]atrim=start=${l.trimIn}:duration=${l.clipDur},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=mono,` +
    `volume=${l.volume},adelay=${Math.max(0, Math.round(l.clipStart * 1000))}:all=1[a${i}]`);
  const labels = [...build.lines.map((_, i) => `[a${i}]`), ...snd.labels];
  const all = `${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,apad,atrim=0:${build.duration}` +
    (snd.labels.length ? ",alimiter=limit=0.95:level=disabled" : "") + "[out]";
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", [...chains, ...snd.chains, all].join(";"),
    "-map", "[out]", "-c:a", "aac", "-b:a", "192k", out]);
  if (r.status !== 0) throw new Error(`mix falhou: ${r.stderr}`);
}

export async function build(id, scene) {
  scene ??= await loadScene(id);
  const json = layout(scene, analyzeScene(scene), `/build/${id}.m4a`);
  const out = join(ENGINE, "public", "build");
  mkdirSync(out, { recursive: true });
  const audioOut = join(out, `${id}.m4a`);
  mix(scene, json, audioOut);
  writeFileSync(join(out, `${id}.json`), JSON.stringify(json));
  return { json, audioOut, scene };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const id = process.argv[2] ?? "mvp-fogueira";
  const { json } = await build(id);
  console.log(`${id}: ${json.duration}s`);
  for (const l of json.lines) console.log(`  ${l.id.padEnd(10)} voz ${l.voiceStart.toFixed(2)}–${l.voiceEnd.toFixed(2)}s`);
}
