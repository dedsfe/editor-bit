Você vai construir o **editor visual v1 (MVP)** do projeto OQJF (vídeos bíblicos 8-bit pro TikTok).

## Leia primeiro
- `roadmap/editor.md`: seção **v1** (é só ela que você vai fazer agora).
- `engine/` é a nossa engine WebGL2 em TypeScript (renderer com luz, normal map e sombra; skins em `engine/src/skins/`; tipos de cena em `engine/src/scene/`; cenários em `engine/src/sets/`).
- `roteiros/ep01-pedro-nas-aguas.md` e os áudios em `audio/ep01/*.m4a` são o material de teste.

## Regras importantes
- **Outro agente está mexendo na `engine/` agora. NÃO edite nada dentro de `engine/`.** Importe os módulos da engine por caminho relativo ou alias do Vite.
- Se faltar algo na engine (API, campo de cena, função), escreva o pedido em `editor/ENGINE-NEEDS.md` e faça um adaptador/stub dentro de `editor/` pra seguir em frente.
- Tudo seu fica em `editor/` (projeto Vite + TypeScript próprio; pode usar React). Projetos salvos em `projetos/*.json`.
- Não faça commit no git.

## O que o v1 precisa ter
1. Preview 9:16 usando o **renderer da própria engine** (o que aparece no editor é o que sai no vídeo), com play/pause e scrub.
2. Timeline com 1 trilha por personagem: blocos de áudio (as falas) que dá pra arrastar, aparar o começo/fim, dividir e ajustar o volume.
3. Clicar no personagem no preview e arrastar pra posição. A sombra atualiza ao vivo. Trocar a skin com 1 clique (lista das skins disponíveis).
4. Painel de luz: direção da luz principal (esquerda ↔ direita + altura), cor e intensidade. Luzes pontuais (fogueira) arrastáveis no preview.
5. Cenário: escolher o cenário base e adicionar objetos de uma biblioteca pequena (barco, fogueira, pedra, palmeira; desenhe em pixel art no mesmo estilo dos sprites, se não existirem): arrastar, escalar, mudar de camada, apagar.
6. Salvar/abrir projeto (.json).
7. Botão exportar MP4. Se a engine ainda não tiver export, deixe o botão chamando um adaptador e registre em ENGINE-NEEDS.md.

## Entrega
- `cd editor && npm install && npm run dev` tem que funcionar.
- Monte um projeto de exemplo `projetos/ep01.json` com Jesus/Pedro/André e os 12 áudios do EP01 na timeline.
- Tire screenshots com Playwright (já instalado em `engine/node_modules`) e salve em `editor/out/`.
- No fim, escreva `editor/RELATORIO.md` em português, curto: o que funciona, o que falta e o que precisa da engine.
