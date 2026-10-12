import { defineConfig } from "vite";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

// Serve os projetos (projetos/<id>.json), que são a fonte de verdade das cenas.
export default defineConfig({
  server: { fs: { allow: [ROOT] } },
  plugins: [{
    name: "oqjf-projetos",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url?.match(/^\/projetos\/([a-z0-9-]+)\.json/);
        if (!m) return next();
        try {
          res.setHeader("Content-Type", "application/json");
          res.end(await readFile(join(ROOT, "projetos", `${m[1]}.json`)));
        } catch { res.statusCode = 404; res.end("{}"); }
      });
    },
  }],
});
