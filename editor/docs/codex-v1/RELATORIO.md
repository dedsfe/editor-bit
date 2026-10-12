# Editor visual v1

Implementado em `editor/`: preview 9:16 pelo Renderer WebGL2 da engine; play/pause e scrub; três trilhas de voz e uma de cenário; mover, aparar, dividir e ajustar volume das falas; arrastar personagens e objetos; trocar skins; luz principal e luzes pontuais; biblioteca pixel art; salvar no disco, baixar e abrir JSON. `projetos/ep01.json` contém os três personagens e os 12 áudios reais, em 63,48 s.

Export MP4 implementado por adaptador local: frames do mesmo compositor do preview + FFmpeg, H.264/AAC, 1080×1920, 30 fps, respeitando cortes e volumes. Requer FFmpeg no PATH e o servidor Vite ativo.

Validação executada: `npm install`, `npm test` e `npm run build` passaram. Os testes verificam durações, JSON, persistência, referências após split e um MP4 curto de fixture com vídeo/áudio. Não validam a exportação completa do EP01.

Pendente: screenshots, cliques reais e revisão visual ampliada. O Playwright da engine foi usado, mas Chrome e Chromium foram impedidos de iniciar pelo sandbox do macOS (`MachPortRendezvous: Permission denied`). `npm run test:ui` gera quatro screenshots em `out/`; `EXPORT_FULL=1 npm run test:ui` também exporta o episódio. A falha está registrada em `out/ui-test.json`; não foram fabricadas screenshots.

A engine precisa publicar Pedro/André, Galileia, props e APIs públicas para montagem editada/export. Existem fallbacks locais; afundamento e resgate aguardam ações na engine. Detalhes em `ENGINE-NEEDS.md`. Revisão da lei de design feita no código, com verificações visuais explicitamente pendentes em `DESIGN-REVIEW.md`. Nada em `engine/` foi editado; nenhum commit foi feito.
