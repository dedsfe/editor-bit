// Sobe o Vite + Chrome headless (compartilhado por shot e export).
import { chromium } from "playwright";
import { createServer } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function openBrowser() {
  const server = await createServer({ root: ENGINE, server: { port: 0 }, logLevel: "error" });
  await server.listen();
  const port = server.httpServer.address().port;
  const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 400, height: 760 } });
  page.on("pageerror", (e) => console.error("[página]", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("[console]", m.text()));
  return {
    page,
    url: (q) => `http://localhost:${port}/?${q}`,
    close: async () => { await browser.close(); await server.close(); },
  };
}
