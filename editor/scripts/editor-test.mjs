// Teste de ponta a ponta do editor num Chrome headless (precisa do `npm run dev` rodando).
// Roda numa CÓPIA do projeto (projetos/teste-editor.json), apagada no fim: nunca mexe no episódio real.
// Uso: node scripts/editor-test.mjs [--whisper] [--export]
import { chromium } from "../../engine/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync, rmSync } from "node:fs";

const SRC = new URL("../../projetos/ep01.json", import.meta.url), COPY = new URL("../../projetos/teste-editor.json", import.meta.url);
writeFileSync(COPY, readFileSync(SRC, "utf8").replace('"id": "ep01"', '"id": "teste-editor"'));
process.on("exit", () => rmSync(COPY, { force: true }));
const PAGE = process.env.EDITOR_URL ?? "http://127.0.0.1:5180/?p=teste-editor";
const flags = new Set(process.argv.slice(2));
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && errors.push(m.text()));
await page.goto(PAGE);
await page.waitForSelector(".timeline .block.clip", { timeout: 30000 });
const ed = () => page.evaluate(() => window.__editor);
/** Abre o "+" da trilha e escolhe a opção. */
const add = async (track, item) => {
  await page.getByRole("button", { name: `Adicionar em ${track}`, exact: true }).click();
  await page.getByRole("menuitem", { name: item }).first().click();
};
const ok = (cond, msg) => { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) process.exitCode = 1; };
const mod = process.platform === "darwin" ? "Meta" : "Control";

// 1) arrastar uma fala e desfazer/refazer
const before = (await ed()).build.lines[0].clipStart;
const clip = page.locator(".block.clip").first();
const box = await clip.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 6 });
await page.mouse.up();
const moved = (await ed()).build.lines[0].clipStart;
ok(moved > before + 1, `arrastar fala: ${before} → ${moved}`);
await page.locator(".tl-scroll").click({ position: { x: 5, y: 5 } }).catch(() => {});
await page.keyboard.press(`${mod}+z`);
ok(Math.abs((await ed()).build.lines[0].clipStart - before) < 1e-6, "Cmd+Z volta a fala pro lugar");
await page.keyboard.press(`${mod}+Shift+z`);
ok(Math.abs((await ed()).build.lines[0].clipStart - moved) < 1e-6, "Cmd+Shift+Z refaz");
await page.getByRole("button", { name: "Desfazer" }).click();
ok(!(await ed()).canUndo, "botão Desfazer volta ao estado do arquivo");

// 2) câmera segue quem fala (e desfaz)
const n0 = (await ed()).scene.cues.length;
await add("Câmera", "Seguir quem fala");
const autos = (await ed()).scene.cues.filter((c) => c.auto === "follow").length;
ok(autos >= 8, `câmera segue quem fala gerou ${autos} cues`);
await page.keyboard.press(`${mod}+z`);
ok((await ed()).scene.cues.length === n0, "Cmd+Z remove os cues automáticos");

// 3) presets e adicionar coisas no cursor (e desfazer tudo)
const BUTTONS = [
  ["Câmera", "Close no rosto"], ["Câmera", "Tremor"], ["Cena", "Clima e hora do dia"], ["Cena", "Relâmpago"], ["Cena", "Trocar cenário"],
  ["Cena", "Multidão cochicha"], ["Ações", "Pular"], ["Ações", "Subir / descer"], ["Ações", "Afundar"], ["Ações", "Segurar a mão"],
  ["Ações", "Olhar pra cima"], ["Ações", "Posicionar"], ["Tela", "Balão de fala"], ["Tela", "Contador"], ["Tela", "Card final"],
];
for (const [track, item] of BUTTONS) await add(track, item);
ok((await ed()).scene.cues.length === n0 + BUTTONS.length, `${BUTTONS.length} tipos de cue adicionados pela barra`);
for (let i = 0; i < BUTTONS.length; i++) await page.keyboard.press(`${mod}+z`);
ok((await ed()).scene.cues.length === n0, `desfez os ${BUTTONS.length} cues`);

// 3b) autosave: 1 s depois da última mudança o arquivo no disco já está igual ao editor
await page.waitForTimeout(1800);
const disk = await page.evaluate(async () => (await (await fetch("/api/project/teste-editor")).json()).scene);
ok(!(await ed()).dirty && disk.cues.length === n0, `autosave gravou sozinho (${disk.cues.length} cues no disco)`);
ok(typeof disk.cues.find((c) => c.type === "lightning").at === "string", "arquivo gravado com tempo no formato curto");

// 4) legenda automática com Whisper (grava no arquivo)
if (flags.has("--whisper")) {
  await add("Legenda", "Whisper: tempo de todas");
  await page.waitForFunction(() => /transcrita/.test(window.__editor.status), null, { timeout: 180000, polling: 1000 });
  const s = (await ed()).scene;
  ok(s.lines.every((l) => l.words?.length), "Whisper: todas as falas com tempo por palavra");
  await page.keyboard.press(`${mod}+s`);
  await page.waitForFunction(() => !window.__editor.dirty, null, { timeout: 10000 });
  ok(true, "salvo (na cópia de teste)");
}

// 5) export pelo botão
if (flags.has("--export")) {
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  await page.waitForFunction(() => window.__lastExport || /Export falhou/.test(window.__editor.status), null, { timeout: 900000, polling: 2000 });
  console.log("export:", await page.evaluate(() => window.__lastExport ?? window.__editor.status));
}

ok(!errors.length, errors.length ? `erros: ${errors.join(" | ")}` : "sem erros no console");
await browser.close();
