# Editor OQJF (v2)

Edita `../projetos/<id>.json` — a mesma cena que a engine renderiza. O preview e o export usam o
`Player` da engine, então o que aparece no editor é exatamente o que sai no MP4.

```bash
npm run dev     # http://127.0.0.1:5180/?p=ep01
node scripts/editor-test.mjs [--whisper] [--export]   # teste de ponta a ponta no Chrome headless
```

- **Timeline:** uma trilha de voz por personagem (arrastar = mover, bordas = aparar), legenda, câmera,
  clima, ações e tela. Cues presos a uma fala andam junto com ela.
- **Câmera:** close no rosto / plano médio / plano geral com 1 clique (suave ou corte seco),
  "câmera segue quem fala" (gera cues marcados como automáticos; apertar de novo substitui) e tremor.
- **Clima:** keyframes de chuva, vento, neblina, relâmpagos, hora do dia (noite → amanhecer), ondas e onda gigante.
- **Legenda:** texto editável por fala; Whisper local (`whisper-cli`) dá o tempo de cada palavra.
- **Desfazer/refazer** em tudo: botões, Cmd+Z, Cmd+Shift+Z.
- **Autosave:** 1 s depois de cada mudança o JSON já está gravado (Cmd+S força na hora).
- Se o JSON mudar fora do editor (ex.: a IA editou), ele recarrega sozinho; com edição pendente, pergunta.
- **Exportar MP4:** o navegador renderiza os frames, o servidor codifica em `engine/out/<id>-editor.mp4`.

A versão v1 do Codex ficou arquivada em `docs/codex-v1/`.
