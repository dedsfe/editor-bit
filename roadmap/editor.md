# Editor OQJF: roadmap v1 → v10

Editor web "de brincadeira" em cima da nossa engine WebGL2 (`engine/`). O preview é a própria engine, então **o que aparece no editor é exatamente o que sai no MP4**, com luz e sombra reagindo ao vivo.

Regra de ouro: **só começa uma versão quando a anterior já produziu um vídeo de verdade.**

---

## v1: MVP (fazer agora)
Objetivo: montar o EP01 (Pedro nas águas) inteiro dentro do editor.

**Tela**
- Preview 9:16 no centro (canvas da engine), com play/pause e barra de tempo pra arrastar (scrub).
- Timeline embaixo com 1 trilha por personagem (falas) + 1 trilha de cenário.
- Painel lateral com as propriedades do que estiver selecionado.

**Funções**
1. **Áudio na timeline:** cada fala vira um bloco que dá pra arrastar pra esquerda/direita, cortar (aparar o começo/fim ou dividir em 2) e ajustar o volume.
2. **Personagens:** clicar no personagem no preview e arrastar pra posição. A sombra muda na hora. Trocar a skin com 1 clique numa lista (Jesus / Pedro / André).
3. **Luz:** escolher a direção da luz principal (slider "esquerda ↔ direita" + altura), a cor e a intensidade. Luzes pontuais (fogueira, tocha) dá pra arrastar no preview.
4. **Cenário:** escolher o cenário base (deserto à noite, mar da Galileia) e adicionar objetos de uma biblioteca pequena (barco, fogueira, pedra, palmeira): arrastar, mudar tamanho, mudar de camada (frente/trás), apagar.
5. **Salvar/abrir projeto** (arquivo `.json` em `projetos/`).
6. **Exportar MP4** usando o export que a engine já tem.

**Fora do v1:** keyframes, legenda editável, música, várias cenas. O movimento dos personagens no EP01 ainda vem do roteiro/ações da engine.

---

## v2: Movimento e cenas
- **Keyframes:** posição, escala e direção do personagem ao longo do tempo (Pedro andando na água).
- **Ações prontas** arrastáveis pra timeline: andar, virar, ajoelhar, levantar mão, afundar, pular.
- **Câmera com keyframes:** pan, zoom, tremor.
- **Várias cenas no mesmo vídeo**, com corte seco e transição (fade com dithering pixelado).
- **Assets novos:** João, Maria, um fariseu genérico, uma multidão (figurantes). Cenários: vila, templo, monte.

## v3: Texto e legenda
- **Legenda automática** com Whisper local (o modelo já está no Mac), editável na timeline.
- Fonte pixel com estilos: normal, grito (tremendo), sussurro.
- **Balões de fala e de pensamento**, presos ao personagem.
- **Widgets do storytelling:** texto-gancho, contador (passos, jarras, cestos), barra de progresso.

## v4: Áudio de verdade
- **Importar a gravação inteira** → separa as falas sozinho (o que foi feito à mão no EP01) e você só aponta quem é quem.
- **Lip-sync com formatos de boca** (A/E/O/M) em vez de só abre/fecha.
- **Música de fundo + biblioteca de efeitos:** ondas, trovão, fogo, vento, multidão, ovelhas. A música abaixa sozinha quando alguém fala (ducking).
- Limpeza de ruído com 1 botão.

## v5: Iluminação e clima
- **Presets de luz:** amanhecer, meio-dia, pôr do sol, noite de lua, tempestade, luz divina.
- Hora do dia animada (a noite virando manhã, como no fim do EP01).
- **Clima:** chuva, vento (roupa e cabelo mexendo), neblina, relâmpago no clique.
- God rays, bloom e várias sombras (uma por luz).

## v6: Biblioteca grande + criador de personagem
- **Criador de skin:** cabelo, barba, roupa, cor da faixa, idade, cajado. Monta um personagem novo em 1 minuto.
- **30+ personagens prontos:** Noé, Abraão, Moisés, Davi, Golias, Sansão, Elias, Daniel, Jonas, Zaqueu, Paulo, os 12 discípulos…
- **Animais:** ovelhas, jumento, leões, grande peixe, pomba, camelo.
- **20+ cenários:** arca, mar Vermelho abrindo, cova dos leões, Jericó, Getsêmani, sepulcro vazio.

## v7: Roteiro → vídeo automático
- **Importar o roteiro `.md`** (formato do `roteiros/ep01`): o editor cria as cenas, coloca os personagens e amarra as falas e legendas sozinho. Você só ajusta.
- Template de 60 s do `aprendizados.md` como projeto inicial.
- **Checagem de cânon:** avisa se uma citação não bate com a ARC ou vem de livro fora dos 66.

## v8: Cinema
- Parallax profundo com várias camadas, câmera "dolly", profundidade de campo pixelada.
- Efeitos: câmera lenta, flash, tremor, zoom dramático.
- **Intro e outro da série** fixas, com o CTA do Oração Diária.

## v9: Publicação
- Export em vários formatos de uma vez: TikTok/Reels/Shorts (9:16) e YouTube (16:9).
- Visualização das áreas seguras de cada app (onde a interface cobre).
- **Capa automática** + sugestão de legenda e hashtags.
- Renderizar vários episódios em fila.

## v10: IA no editor + ponte pro app
- **Assistente dentro do editor:** "coloca uma tempestade aqui", "Pedro anda até o Jesus em 3 s", "deixa a luz de pôr do sol".
- **Retenção do TikTok importada:** marca na timeline onde o público saiu, pra cortar no próximo vídeo.
- Histórico de versões do projeto.
- **As mesmas skins no app OQJF (chatbot iOS):** o Jesus do TikTok vira o Jesus do app.
