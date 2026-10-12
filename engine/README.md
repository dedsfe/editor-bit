# Engine OQJF

Vídeo 8-bit com luz 2.5D (WebGL2 próprio). Tudo é renderizado em 180×320 e ampliado 6× com nearest-neighbor.

## Uma fonte de verdade

Cada episódio é **um arquivo**: `../projetos/<id>.json`. É o formato `Scene` (`src/scene/types.ts`):
cenário, personagens, falas (áudio + legenda), clima e cues. O editor (`../editor`) lê e grava esse
mesmo arquivo, e a engine renderiza ele direto. Mexer no JSON à mão ou pela IA = aparece no editor.

## Comandos

```bash
npm run check  -- <id>   # valida o JSON + monta a timeline + folha de frames em out/<id>-check.png
npm run build  -- <id>   # analisa os áudios (cache), monta a linha do tempo e o áudio mixado
npm run dev              # preview simples: http://localhost:5173/?scene=<id>
npm run export -- <id>   # out/<id>.mp4 (1080×1920, 30 fps, com áudio)
npm run shot   -- <id> 1 4.5 [--cam=x,y,zoom]   # frames soltos em PNG
```

## Onde fica cada coisa

| Pasta | O quê |
|---|---|
| `src/scene/types.ts` | o formato da cena (falas, cues, clima) |
| `src/scene/layout.ts` | áudio analisado → linha do tempo (mesma função no Node e no editor) |
| `src/scene/timeline.ts` | estado em qualquer tempo t: personagens, câmera, clima, legenda |
| `src/scene/auto.ts` | botões automáticos (ex.: câmera segue quem fala) |
| `src/player.ts` | junta tudo e desenha um frame (preview, editor e export usam o mesmo) |
| `src/skins/` | personagens como dados (camadas, paleta, boca, olhos, gestos) |
| `src/sets/` | cenários (`campfire`, `galilee`) + clima genérico (`weather.ts`: chuva, raio) |
| `src/core/renderer.ts` | luz + normal map + sombra + água + neblina + bloom + god rays + dithering |

## Cues disponíveis

`walk` (com `hop` = pulo pra descer/subir no barco), `face`, `sink` (afundar), `reach`/`gesture`,
`hold` (segurar a mão, com brilho quente), `camera` (x/y/zoom fixos ou `actor` + `shot`: close/medium/wide;
`dur: 0` = corte seco), `shake`, `weather` (rain, wind, fog, lightning, daylight, waves, swell com transição),
`lightning`, `hook`, `bubble`, `thought`, `counter`, `card`.
Tempo: segundos fixos (`12.5`) ou preso a uma fala, no formato curto: `"05-jesus"`, `"05-jesus:end"`,
`"05-jesus+0.3"`, `"10-pedro:end-1.3"` (anda junto com a fala se o áudio mudar). O formato longo
`{ "line", "at", "offset" }` também funciona.
