O EP01 ficou PERFEITO, você amassou. Agora o desafio: **refazer o mesmo EP01, igualzinho, só que 100% pelo editor.**

## 1. Áudio novo
Os 12 áudios em `audio/ep01/` foram trocados por versões bem mais limpas (o ruído de fundo caiu de -41 dB pra -87 dB). Os antigos estão em `audio/ep01/v1-antigo/`. Usa os novos.

## 2. O editor agora é seu
O Codex construiu o editor v1 em `editor/` (React + Vite, importa a sua engine) e já terminou. Ninguém mais está mexendo nele. Leia `editor/RELATORIO.md` e `editor/ENGINE-NEEDS.md`.
- **Uma fonte de verdade só:** o arquivo de projeto (`projetos/ep01.json`) é o mesmo formato de cena que a engine renderiza. O editor lê e grava esse arquivo, e quando você (IA) mexe, mexe no mesmo arquivo. **Toda mudança que a IA faz tem que ser uma mudança que dá pra fazer e ver no editor.**
- Troca os adaptadores e stubs do Codex (Pedro, André, mar, props, export) pelas suas versões de verdade da engine.

## 3. O que o editor precisa ganhar
1. **Zoom fácil (câmera):** keyframes de câmera com presets de 1 clique ("close no rosto de [personagem]", "plano médio", "plano geral"), corte seco ou transição suave. E um botão **"câmera segue quem fala"**, que alterna o close entre os personagens conforme as falas da timeline.
2. **Tremor de câmera** na timeline, com intensidade e duração.
3. **Clima:** chuva, vento, relâmpago e neblina, com intensidade e keyframes, mais a hora do dia (noite → amanhecer).
4. **Legenda automática da minha voz:** usa o `whisper-cli` local com o modelo `/Users/andrefelipe/Programação/Conteúdo Oração Diária/Cortes e Clips/modelos/ggml-small-q5_1.bin` (ou o texto do roteiro), e deixa dar pra corrigir na timeline.
5. **Desfazer/refazer** em tudo (botões + Cmd+Z / Cmd+Shift+Z). Hoje, se eu arrasto um bloco, não consigo voltar.
6. **Todo o resto que você usou no EP01** com controle na interface: balões, contador de passos, texto-gancho, cards finais, ações (andar sobre a água, descer do barco, afundar, segurar a mão), brilho quente nas mãos.

## 4. Teste final
Monta o EP01 só pelo projeto do editor, exporta pelo **botão do editor** → `engine/out/ep01-editor.mp4`. Gera uma folha de frames comparando lado a lado com o `ep01.mp4` original e me diz o que ficou diferente. Abre o editor no navegador no final.

## Regras de fé (Assembleia de Deus)
Jesus sem auréola, sem halo, sem estética católica. As falas dele são só o que está no áudio.
