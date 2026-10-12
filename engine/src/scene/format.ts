// Grava a cena em JSON legível: indentado, mas objetos/listas pequenos numa linha só
// (cada palavra do Whisper, cada cue simples). Fica fácil de ler e de editar à mão.
import type { Scene } from "./types.ts";

export function formatScene(scene: Scene, width = 110): string {
  const pretty = JSON.stringify(scene, null, 2);
  // junta, de dentro pra fora, blocos { } / [ ] sem nada aninhado que caibam em `width`
  let out = pretty, prev = "";
  while (out !== prev) {
    prev = out;
    out = out.replace(/^(\s*)(.*?)([{[])\n([^{}[\]]*?)\n\s*([}\]])/gm, (m, indent: string, head: string, open: string, body: string, close: string) => {
      const items = body.split("\n").map((l) => l.trim()).join(" ");
      const line = open === "{" ? `${indent}${head}{ ${items} }` : `${indent}${head}[${items}]`;
      return line.length <= width ? line : m;
    });
  }
  return out + "\n";
}
