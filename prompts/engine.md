Projeto OQJF (pasta /Users/andrefelipe/orca/projects/OQJF). Preciso que você construa uma **engine de vídeo 8-bit com iluminação 2.5D** pra gerar vídeos de histórias bíblicas pro TikTok.

## Contexto
- Vídeos curtos (≤60 s, 9:16, 1080×1920, 30 fps) com personagens bíblicos em pixel art 8-bit, cenários que mudam, e falas dubladas por mim (sotaques regionais brasileiros: baiano, carioca, paulista, mineiro, gaúcho…).
- Já existe um Jesus 8-bit desenhado em código: `design/animate.py` (sprite como grid de letras, separado em camadas: cabeça, corpo, cajado, pés; animações idle/falar/andar). Reaproveite esse sprite e esse jeito de animar por partes.
- O roteiro e as regras de storytelling ficam em `storytelling/aprendizados.md`. Não precisa mexer nele, mas o formato de cena tem que suportar o "Template de roteiro" que está lá (balão de fala, balão de pensamento, contador/progresso na tela, texto de gancho).

## O que eu quero visualmente
Pixel art 8-bit **com iluminação bonita estilo 2.5D** (pensa em jogos tipo Octopath Traveler / Celeste / Eastward):
- Luzes dinâmicas (fogueira tremulando, tocha, sol, lua, luz "divina"), com cor e raio.
- Sprites com **normal map** pra luz bater com volume. Gere os normal maps automaticamente a partir do sprite (bevel/altura por distância da borda) com opção de ajustar na mão.
- Sombras projetadas no chão, oclusão simples.
- Camadas de parallax com profundidade, neblina/fog por profundidade.
- Raios de luz (god rays), bloom suave, partículas (poeira, brasas, água, folhas).
- Tudo renderizado em **resolução baixa** (ex.: 180×320) e ampliado com nearest-neighbor, opcionalmente com quantização de paleta + dithering, pra manter o visual 8-bit mesmo com a luz.

## Tecnologia
Pode usar qualquer coisa livre: TypeScript, Vite, WebGL2, PixiJS, Three.js, regl, etc. Não precisa ser iOS.
1. Faça um **spike curto** comparando 1 ou 2 caminhos (ex.: PixiJS v8 com shaders próprios vs WebGL2 puro com deferred lighting 2D). Escolha pelo resultado visual e pela facilidade de VOCÊ (IA) manipular depois via código.
2. Se nenhuma lib entregar bem luz + normal map + sombra em pixel art, **crie nossa própria engine mínima** em WebGL2. Prioridade: fácil de controlar por código/JSON, não feature completa de game engine.

## Pipeline (como vamos trabalhar)
1. Eu recebo o roteiro (máx. 3 personagens falando + figurantes), gravo as falas.
2. **Áudio: 1 arquivo por fala**, nomeado pelo id da fala no roteiro (ex.: `audio/ep01/03-pedro.m4a`). A engine lê a duração de cada arquivo e monta a linha do tempo sozinha. Eu não quero ficar marcando tempo na mão.
3. **Lip-sync automático:** a boca do personagem que está falando abre/fecha pela amplitude do áudio (RMS → 0/1/2 aberturas). Quem não fala fica em idle (respira, pisca).
4. **Cena descrita em arquivo TS/JSON:** cenário, luzes, personagens, posição, ação (andar até X, virar, gesto), câmera (zoom/pan/shake), textos e balões, cada um amarrado a uma fala ou a um tempo.
5. **Legenda queimada** em fonte pixel (TikTok precisa), sincronizada com as falas.
6. **Export determinístico pra MP4** com áudio (render frame a frame, por exemplo Playwright/Puppeteer + ffmpeg, ou WebCodecs + muxer). Também quero um **preview no navegador** com play/pause e scrub.

## Primeira entrega (MVP)
Uma cena de ~10 s: **Jesus parado à noite perto de uma fogueira**. O fogo tremula e ilumina ele com normal map, tem sombra no chão, céu com lua e parallax, partículas de brasa. Ele fala uma frase de teste (gere um áudio de teste qualquer, até um tom ou TTS, só pra validar o lip-sync) e sai exportado em MP4 9:16.
Depois disso, a gente evolui: mais personagens (Pedro, Maria, discípulos), mais cenários (mar da Galileia, deserto, templo, Caná), mais animações.

## Regras
- Mantenha tudo dentro de `engine/` no projeto.
- Mostre o resultado com screenshot/frames a cada avanço antes de seguir.
- Eu tenho TDAH: respostas curtas, 1 próximo passo por vez, sem menu de opções.
