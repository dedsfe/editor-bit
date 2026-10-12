// Roda um .ts da engine no Node usando o Vite (resolve imports sem extensão).
import { createServer } from "vite";
const server = await createServer({ server: { middlewareMode: true }, logLevel: "error", appType: "custom" });
try { await server.ssrLoadModule(process.argv[2]); } finally { await server.close(); }
