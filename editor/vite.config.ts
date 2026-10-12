// Servidor local do editor: lê/grava projetos/<id>.json (a mesma cena que a engine renderiza),
// serve os áudios, analisa voz (lip-sync), transcreve com Whisper e codifica o MP4 do export.
import { defineConfig, type Plugin } from "vite";
import { readFile, writeFile, readdir, stat, mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
// @ts-expect-error módulo .mjs da engine (sem tipos)
import { analyze, analyzeScene, audioFile, mix, loadSounds } from "../engine/scripts/build.mjs";
import { layout } from "../engine/src/scene/layout.ts";
import type { Scene } from "../engine/src/scene/types.ts";
import { formatScene } from "../engine/src/scene/format.ts";

const ROOT = resolve(import.meta.dirname, "..");
const PROJECTS = join(ROOT, "projetos");
const OUT = join(ROOT, "engine", "out");
const WHISPER_MODEL = process.env.WHISPER_MODEL ??
  "/Users/andrefelipe/Programação/Conteúdo Oração Diária/Cortes e Clips/modelos/ggml-small-q5_1.bin";

const ID = /^[a-z0-9][a-z0-9-]*$/;
const SOURCE = /^[\w.-]+$/;

async function body(req: IncomingMessage, limit = 50_000_000): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let n = 0;
  for await (const c of req) {
    n += c.length;
    if (n > limit) throw new Error("requisição grande demais");
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks);
}
const json = async (req: IncomingMessage) => JSON.parse((await body(req)).toString("utf8"));

/** Pasta de áudio validada (sempre dentro do projeto). */
function audioDir(dir: string) {
  const abs = resolve(ROOT, dir);
  if (!abs.startsWith(join(ROOT, "audio"))) throw new Error("pasta de áudio inválida");
  return relative(ROOT, abs);
}

interface Job { ff: ChildProcessWithoutNullStreams; frames: number; total: number; out: string; dir: string; log: string; done: Promise<void> }
const jobs = new Map<string, Job>();

function api(): Plugin {
  return {
    name: "oqjf-editor-api",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const reply = (v: unknown, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(v));
        };
        try {
          const url = new URL(req.url, "http://x");
          const parts = url.pathname.split("/").filter(Boolean).slice(1); // sem "api"

          // ---- projetos
          if (parts[0] === "projects" && req.method === "GET" && parts.length === 1) {
            const files = (await readdir(PROJECTS)).filter((f) => f.endsWith(".json") && ID.test(f.slice(0, -5)));
            return reply(files.map((f) => f.slice(0, -5)));
          }
          if (parts[0] === "project" && ID.test(parts[1] ?? "")) {
            const file = join(PROJECTS, `${parts[1]}.json`);
            if (parts[2] === "mtime") return reply({ mtime: (await stat(file)).mtimeMs });
            if (req.method === "GET") {
              const [text, st] = await Promise.all([readFile(file, "utf8"), stat(file)]);
              return reply({ scene: JSON.parse(text), mtime: st.mtimeMs });
            }
            if (req.method === "PUT") {
              const scene = await json(req) as Scene;
              if (scene.id !== parts[1] || !Array.isArray(scene.lines) || !scene.set?.kind) throw new Error("cena inválida");
              await writeFile(file, formatScene(scene));
              return reply({ saved: `projetos/${parts[1]}.json`, mtime: (await stat(file)).mtimeMs });
            }
          }

          // ---- áudio
          if (parts[0] === "audio" && req.method === "GET") {
            const dir = audioDir(url.searchParams.get("dir") ?? "");
            const source = url.searchParams.get("source") ?? "";
            if (!source) {
              const files = await readdir(join(ROOT, dir));
              return reply([...new Set(files.filter((f) => /\.(m4a|wav|mp3|aac|ogg|flac|aiff)$/.test(f)).map((f) => f.replace(/\.[^.]+$/, "")))].sort());
            }
            if (!SOURCE.test(source)) throw new Error("áudio inválido");
            const file = audioFile(dir, source);
            res.setHeader("Content-Type", "audio/mp4");
            res.end(await readFile(file));
            return;
          }
          if (parts[0] === "analysis" && req.method === "POST") {
            const { dir, sources } = await json(req) as { dir: string; sources: string[] };
            const d = audioDir(dir);
            const out: Record<string, unknown> = {};
            for (const s of sources) {
              if (!SOURCE.test(s)) throw new Error("áudio inválido");
              out[s] = analyze(audioFile(d, s));
            }
            return reply(out);
          }

          // ---- sons (biblioteca em sons/, lista em sons/manifest.json)
          if (parts[0] === "sounds" && req.method === "GET") return reply(loadSounds());
          if (parts[0] === "sound" && req.method === "GET") {
            const info = (loadSounds() as { id: string; arquivo: string }[]).find((s) => s.id === url.searchParams.get("id"));
            if (!info) throw new Error("som inexistente");
            const file = resolve(ROOT, "sons", info.arquivo);
            if (!file.startsWith(join(ROOT, "sons"))) throw new Error("som inválido");
            res.setHeader("Content-Type", file.endsWith(".ogg") ? "audio/ogg" : "audio/wav");
            res.end(await readFile(file));
            return;
          }

          // ---- legenda automática (whisper-cli local)
          if (parts[0] === "transcribe" && req.method === "POST") {
            const { dir, source } = await json(req) as { dir: string; source: string };
            if (!SOURCE.test(source)) throw new Error("áudio inválido");
            const tmp = await mkdtemp(join(tmpdir(), "oqjf-whisper-"));
            try {
              const wav = join(tmp, "a.wav");
              const conv = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", audioFile(audioDir(dir), source), "-ar", "16000", "-ac", "1", wav]);
              if (conv.status !== 0) throw new Error(String(conv.stderr));
              const w = spawnSync("whisper-cli", ["-m", WHISPER_MODEL, "-l", "pt", "-ml", "1", "-sow", "-oj", "-of", join(tmp, "out"), "-np", wav]);
              if (w.status !== 0) throw new Error(`whisper-cli falhou: ${w.stderr}`);
              const data = JSON.parse(await readFile(join(tmp, "out.json"), "utf8"));
              const words = (data.transcription as { text: string; offsets: { from: number; to: number } }[])
                .map((s) => ({ w: s.text.trim().replace(/^"|"$/g, ""), t0: s.offsets.from / 1000, t1: s.offsets.to / 1000 }))
                .filter((x) => x.w);
              return reply({ text: words.map((x) => x.w).join(" "), words });
            } finally { await rm(tmp, { recursive: true, force: true }); }
          }

          // ---- export: o navegador renderiza os frames com o Player da engine e manda pra cá
          if (parts[0] === "export" && parts[1] === "start" && req.method === "POST") {
            const scene = await json(req) as Scene;
            if (!ID.test(scene.id)) throw new Error("id inválido");
            const build = layout(scene, analyzeScene(scene));
            const dir = await mkdtemp(join(tmpdir(), "oqjf-export-"));
            const audio = join(dir, "audio.m4a");
            mix(scene, build, audio);
            await mkdir(OUT, { recursive: true });
            const out = join(OUT, `${scene.id}-editor.mp4`);
            const ff = spawn("ffmpeg", [
              "-y", "-v", "error",
              "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "180x320", "-r", "30", "-i", "-",
              "-i", audio,
              "-vf", "vflip,scale=1080:1920:flags=neighbor",
              "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p",
              "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out,
            ]);
            const job: Job = { ff, frames: 0, total: Math.ceil(build.duration * build.fps), out, dir, log: "", done: Promise.resolve() };
            ff.stderr.on("data", (d) => (job.log = (job.log + d).slice(-4000)));
            job.done = new Promise((ok, fail) => ff.on("close", (c) => (c === 0 ? ok() : fail(new Error(job.log || `ffmpeg ${c}`)))));
            job.done.catch(() => {});
            const id = randomUUID();
            jobs.set(id, job);
            return reply({ job: id, total: job.total });
          }
          if (parts[0] === "export" && jobs.has(parts[1])) {
            const job = jobs.get(parts[1])!;
            if (parts[2] === "frames" && req.method === "POST") {
              const buf = await body(req, 200_000_000);
              if (buf.length % (180 * 320 * 4)) throw new Error("lote de frames com tamanho errado");
              if (!job.ff.stdin.write(buf)) await new Promise((r) => job.ff.stdin.once("drain", r));
              job.frames += buf.length / (180 * 320 * 4);
              return reply({ frames: job.frames });
            }
            if (parts[2] === "finish" && req.method === "POST") {
              job.ff.stdin.end();
              try { await job.done; } finally { jobs.delete(parts[1]); await rm(job.dir, { recursive: true, force: true }); }
              return reply({ out: relative(ROOT, job.out), frames: job.frames });
            }
          }
          reply({ error: "rota inexistente" }, 404);
        } catch (e) {
          reply({ error: e instanceof Error ? e.message : String(e) }, 400);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [api()],
  server: { fs: { allow: [ROOT] }, host: "127.0.0.1", port: 5180 },
});
