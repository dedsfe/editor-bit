Você vai montar a **biblioteca de sons** do projeto OQJF: vídeos curtos (TikTok/Reels, 9:16, ≤60 s) de histórias de Jesus em pixel art 8-bit com iluminação 2.5D, dublados em português com sotaques brasileiros. O canal vai ser **monetizado** e serve de anúncio do app "Oração Diária". Então **toda licença precisa permitir uso comercial em redes sociais**.

Contexto do projeto (leia antes): `roteiros/` (EP01 Pedro nas águas, EP02 Zaqueu, EP03 Pai Nosso), `roadmap/editor.md`, `engine/` (engine WebGL2 em TypeScript) e `editor/` (editor React que monta os episódios). **NÃO edite nada em `engine/` nem em `editor/`**: tudo seu fica em `sons/`. Não faça commit.

Queremos som **realista** (não chiptune), mesmo com o visual sendo 8-bit.

## Parte 1: pesquisa a fundo (use a busca na web, MUITAS buscas)
Pesquise e compare, com link de cada fonte:
1. **Bibliotecas liberadas**: Freesound (filtro CC0), Sonniss GDC bundles, Kenney, OpenGameArt, Pixabay Sound Effects, Mixkit, ZapSplat, BBC Sound Effects (atenção: verificar se a licença RemArc permite uso comercial), Soundly free, Free To Use Sounds, Internet Archive, e outras que você achar. Pra cada uma: licença exata, se permite uso comercial e monetizado no TikTok/YouTube, se exige atribuição, qualidade, se dá pra baixar por API/script e se tem os sons da nossa lista.
2. **Som gerado por computador (procedural)**: técnicas reais pra sintetizar chuva, trovão, vento, ondas, fogo, passos na areia, na água e na madeira. Referências como Andy Farnell ("Designing Sound"), Pure Data, Web Audio API, Tone.js, SuperCollider e artigos e repositórios com receitas. O que soa bem e o que soa falso.
3. **IA que gera efeito sonoro**: Stable Audio Open, AudioGen/AudioCraft (Meta), AudioLDM e outros modelos abertos que rodem localmente num Mac (Apple Silicon). Pra cada um: **licença dos pesos pra uso comercial** (muitos são não-comerciais, verifique na fonte), qualidade, tempo de geração e como instalar. Compare também com serviços pagos (ElevenLabs SFX etc.) em preço e limites.
4. **Foley caseiro**: como gravar sons de verdade com celular (pisar em areia, água num balde, roupa mexendo, bater madeira). Dicas rápidas e práticas.

## Parte 2: lista de sons que precisamos (prioridade)
Passos: na areia, na terra, na pedra, na água rasa, na chuva, sandália de couro, correndo · Água: ondas calmas, mar agitado/tempestade, respingo/splash, alguém afundando, barco de madeira rangendo, remo na água · Clima: chuva fraca/forte, trovão perto/longe, vento forte, ventania com assobio · Ambiente: multidão murmurando (sem palavras inteligíveis), mercado antigo, vila de dia, noite com grilos, fogueira estalando, pássaros de manhã · Objetos/animais: galho de árvore balançando/quebrando, alguém caindo no chão de terra, porta de madeira, jarro de barro, moedas, ovelhas, jumento, leão rugindo/rosnando · Efeitos de cena: "brilho" suave pra milagre (não pode soar mágico/fantasia demais), whoosh de transição, impacto de câmera tremendo, risada abafada de plateia (pros momentos de humor).

## Parte 3: entregas em `sons/`
1. `sons/PESQUISA.md`: o relatório completo em português, com tabela comparando as fontes (licença, uso comercial, atribuição, API, qualidade), recomendações claras ("use X pra isso, Y pra aquilo") e todos os links. Termine com um resumo de 10 linhas pro dono do projeto, que é leigo e tem TDAH: direto, sem jargão.
2. `sons/biblioteca/`: **baixe de verdade** um primeiro lote (~30 sons) da lista acima, **somente CC0 ou licença comercial clara**, organizados por pasta (passos/, agua/, clima/, ambiente/, objetos/, efeitos/), em `.wav` ou `.ogg`, cortados e normalizados (ffmpeg está instalado).
3. `sons/manifest.json`: 1 entrada por som com `id`, `arquivo`, `tags`, `duracao`, `fonte` (URL da página), `autor`, `licenca`, `exige_atribuicao` e `loop` (true/false). O editor vai ler isso depois.
4. `sons/CREDITOS.md`: lista de atribuição pronta pra colar na descrição do vídeo, se alguma fonte exigir.
5. `sons/gerador/`: protótipo de **síntese procedural** (Python com numpy/scipy, ou Node) gerando pelo menos: chuva, trovão, vento, ondas, passos na areia e passos na água. Salve os resultados em `sons/gerador/saida/` pra comparar com os sons baixados. Diga honestamente quais ficaram bons e quais ficaram falsos.
6. Se algum modelo de IA aberto **com licença comercial** rodar bem localmente, documente a instalação passo a passo em `sons/IA.md` (pode testar se for rápido, mas não gaste horas baixando modelos gigantes).

Regras: nada de som com licença duvidosa, "free for personal use" ou não-comercial. Na dúvida, fica de fora e você explica no relatório. Não invente licença: confira na página oficial.
