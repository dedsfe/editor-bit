// Dirige o editor num Chrome headless: abre, confere erros, tira screenshot e (opcional) clica em ações.
// Uso: node scripts/editor-ui.mjs <passo...>   passos: shot:<nome> | seek:<s> | click:<texto> | key:<tecla> | export | wait:<ms>
import { chromium } from "playwright";
const url = process.env.EDITOR_URL ?? "http://127.0.0.1:5180/?p=ep01";
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url);
await page.waitForSelector(".timeline .block.clip", { timeout: 30000 });
for (const step of process.argv.slice(2)) {
  const [cmd, ...rest] = step.split(":"), arg = rest.join(":");
  if (cmd === "shot") await page.screenshot({ path: `out/${arg}.png` });
  if (cmd === "wait") await page.waitForTimeout(+arg);
  if (cmd === "seek") await page.evaluate((t) => {
    const lane = document.querySelector(".ruler .lane"); const r = lane.getBoundingClientRect();
    const zoom = r.width; return { r, zoom };
  }, +arg).then(async ({ r }) => {
    const dur = await page.evaluate(() => document.querySelector(".clock").textContent);
    const total = dur.split("/")[1].trim().split(":"); const secs = +total[0] * 60 + +total[1];
    await page.mouse.click(r.x + ((r.width - 40) * +arg) / secs, r.y + 10);
  });
  if (cmd === "click") await page.getByRole("button", { name: arg, exact: false }).first().click();
  if (cmd === "key") await page.keyboard.press(arg);
  if (cmd === "export") {
    await page.getByRole("button", { name: "Exportar MP4" }).click();
    await page.waitForFunction(() => window.__lastExport || /Export falhou/.test(document.querySelector("footer").textContent), null, { timeout: 900000, polling: 2000 });
    console.log("export:", await page.evaluate(() => window.__lastExport ?? document.querySelector("footer").textContent));
  }
}
console.log("status:", await page.textContent("footer"));
console.log(errors.length ? errors : "sem erros");
await browser.close();
