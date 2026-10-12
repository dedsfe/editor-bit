# Biblioteca de sons OQJF

Pesquisa em 12/10/2026. Objetivo: efeitos realistas para vídeos de Jesus em pixel art, com dublagem brasileira, monetização e anúncios do Oração Diária. Foram lidos os três roteiros e o roadmap do editor. Nenhum código de `engine/` ou `editor/` foi alterado.

## Decisão prática

Use gravações para multidão, pássaros, passos e animais. Use Kenney para impactos e objetos. Use síntese para camadas de vento e chuva, e para experimentar variações. A prioridade do EP03 é uma esquina cheia que contrasta com um monte silencioso; a voz deve continuar em primeiro plano. Consulte [EP03.md](EP03.md) para os arquivos e a montagem sugerida.

O primeiro lote é uma seleção, não a cobertura integral da lista de desejos. [COBERTURA.md](COBERTURA.md) distingue sons entregues, substitutos e lacunas. O manifesto usa caminhos relativos a `sons/`, segundos numéricos e identificadores estáveis. A síntese experimental fica fora da biblioteca de gravações.

## Bibliotecas: licença e utilidade

“Sim” na coluna comercial significa que a licença permite incorporar o som num vídeo monetizado ou anúncio no TikTok/YouTube, cumprindo suas condições. Não significa autorização para revender uma biblioteca de sons. Qualidade é avaliação de adequação do catálogo e das descrições oficiais, não resultado de teste auditivo de todos os acervos.

| Fonte e documentação oficial | Licença exata | Comercial e monetizado | Atribuição | API / download por script | Qualidade e cobertura útil |
|---|---|---|---|---|---|
| [Freesound](https://freesound.org/help/faq/), [API](https://freesound.org/help/developers/) | Por arquivo: selecionar **CC0 1.0 Universal**. Também há CC BY e CC BY-NC | Sim para CC0; NC excluída | CC0: não | API autenticada, com termos próprios para aplicação comercial; originais precisam de login/OAuth. Previews comprimidos são públicos. Nesta sessão houve 429 e depois 403; downloads suspensos | Muito amplo: pedras, areia, água, walla, mercado, vento, aves, animais. Qualidade varia por gravador |
| [Sonniss GDC](https://sonniss.com/gdc-bundle-license/) | **GDC Bundle License v2.0**, vigente desde 27/08/2026 para novos downloads | Sim, sincronizado em projetos | Não | ZIP/torrent oficial, sem API pública identificada; pacotes de vários GB | Foley e ambientes profissionais, impactos, água e objetos. Não é CC0; não redistribuir como asset pack |
| [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds), [RPG Audio](https://kenney.nl/assets/rpg-audio) | **CC0 1.0** | Sim | Não | ZIP direto, sem chave; usado neste lote | Efeitos secos curtos, madeira, concreto, tecido, metal. Bom para edição; sem grande catálogo de ambientes humanos |
| [OpenGameArt](https://opengameart.org/node/5571) | Por item: CC0, CC BY, CC BY-SA, OGA-BY e outras | CC0 e CC BY: sim; conferir o item | Depende: CC0 não; BY sim | Links de arquivos/ZIP, sem API oficial estável identificada | Packs comunitários de Foley, natureza e efeitos. Algumas coleções são sintéticas; filtrar o que parece jogo eletrônico |
| [Pixabay](https://pixabay.com/service/license-summary/), [termos](https://pixabay.com/service/terms/) | **Pixabay Content License** para conteúdo atual; não presumir CC0 | Sim, com restrições | Não | Download web. [API pública](https://pixabay.com/api/docs/) documenta imagens/vídeos, não um endpoint geral de SFX | Água, clima, animais e transições. Evitar arquivos com música reconhecível. Não distribuir arquivos isolados como biblioteca |
| [Mixkit SFX](https://mixkit.co/license/modal/sfxFree/), [termos](https://mixkit.co/terms/) | **Mixkit Sound Effects Free License** | Sim, inclui redes sociais e publicidade | Não | Downloads web individuais; sem API pública identificada | Efeitos prontos e limpos. Restrição explícita sobre item isolado, ferramenta/template e arquivos-fonte: usar em vídeo final, não neste asset pack |
| [ZapSplat](https://www.zapsplat.com/license-type/standard-license/), [créditos](https://www.zapsplat.com/how-to-credit-us/) | **ZapSplat Standard License**; verificar exceções de terceiros | Sim sob os termos do arquivo/conta | Basic: sim; modalidade paga pode dispensar | Conta; MP3 gratuito e WAV conforme plano. Sem API pública de download identificada | Muito bom em sandália, barro, passos, animais e objetos específicos. Não redistribuir acervo |
| [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/faqs) | **RemArc Licence** para o download gratuito | **Não** para monetização, anúncios ou patrocínio. Licença comercial separada via Pro Sound Effects | Não resolve a proibição comercial | WAV na web; acesso gratuito não é liberação comercial | Acervo excelente de mercados, animais e paisagens. Excluído do lote gratuito |
| [Soundly](https://getsoundly.com/support/), [EULA](https://getsoundly.com/assets/Soundly-EULA.pdf) | **Soundly SFX License Agreement**; fontes externas mantêm suas licenças | Sim para sua biblioteca sob EULA | Biblioteca própria: não; verificar extras | Aplicativo desktop e exportação; sem API pública de aquisição identificada | Biblioteca gratuita limitada, Foley/clima profissionais. Add-on Freesound deve ser filtrado para CC0 |
| [Free To Use Sounds](https://www.freetousesounds.com/license-agreement) | **License Agreement** próprio, concedido nas bibliotecas adquiridas | Sim nos termos da aquisição | Verificar pacote; licença consultada não estabelece crédito obrigatório geral | Packs na loja; sem API pública identificada | Gravações de campo de qualidade, cidades e mercados. Nome “free” não prova que um pack seja gratuito ou CC0; equipe com mais de 5 pessoas precisa consultar a licença adequada |
| [Internet Archive](https://archive.org/about/terms.php), [metadados](https://archive.org/developers/md-read.html) | Por item, sem licença universal | Só quando a licença/proveniência do item comprovar | Depende | JSON de metadados e arquivos diretos; fácil automatizar | Abrange tudo, mas procedência heterogênea. Upload não transfere direitos; não entrou no lote |
| [SoundBible](https://soundbible.com/about.php) | Por arquivo: **CC BY 3.0 Unported**, Public Domain e também licenças inadequadas | Sim para BY 3.0 e Public Domain | BY 3.0: sim | WAV/MP3 direto via `grab.php`; sem chave; usado neste lote | Gravações de natureza, multidão, água e animais. Excluir Personal Use Only, NC e Sampling Plus neste projeto |

### Critérios para guardar um arquivo

1. Conferir licença e autor na página individual, não no título de uma busca.
2. Guardar página de origem, metadados, data e hash do áudio baixado. As provas locais estão em `fontes/`; `fontes/proveniencia.json` registra os arquivos realmente usados.
3. Só admitir CC0, CC BY comercial claro ou licença contratual que cubra o uso. Não reinterpretar “royalty free” como “domínio público”.
4. Conferir o som no contexto: buzina, motor, anúncio de loja, música e conversa legível podem tornar uma gravação inadequada para uma cidade antiga.
5. Preservar os créditos após cortar, filtrar ou misturar. [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) permite adaptação e redistribuição comercial mediante atribuição; o texto pronto inclui título, autor, fonte, licença e alterações.

A Sonniss mudou seus termos recentemente. A v2.0 permite compartilhamento com a própria equipe que trabalha no projeto, mas restringe entrega como biblioteca a terceiros e uso em treinamento de IA. Os termos do dia do download prevalecem sobre uma cópia antiga dentro do ZIP. Não baixei os bundles grandes para este lote. [Licença oficial](https://sonniss.com/gdc-bundle-license/).

## Procedural: o que realmente produzir

Referência principal: Andy Farnell, *Designing Sound*, MIT Press, 2010. A editora disponibiliza [exemplos de Pure Data](https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/8375/designing_sound.zip/index.html), incluindo chuva, trovão, fogo e passos. As receitas abaixo são sínteses e escolhas de implementação originais, não cópias dos patches do livro.

| Som | Receita plausível | O que denuncia o falso | Uso recomendado |
|---|---|---|---|
| Chuva | Ruído de banda larga filtrado + muitas gotas aleatórias com ataques curtos e amplitudes diferentes | Só ruído branco constante parece interferência; gotas idênticas parecem metrônomo | Cama discreta sob chuva gravada |
| Trovão | Massa de ruído grave, ataque irregular, várias reflexões atrasadas e cauda filtrada; perto tem estalo, longe perde agudos | Um tom grave com queda de pitch soa explosão de jogo | Usar gravação na frente, síntese para reforço grave |
| Vento | Ruído rosa filtrado, rajadas lentas sem periodicidade óbvia; ressonância se passar por fresta | Senoide tonal fixa vira nave/assobio; clipping de microfone não é vento útil | É um dos casos mais promissores para síntese |
| Ondas | Ruído grave na arrebentação + espuma aguda com atraso, ciclos variáveis e água residual | Ciclo exato de 5 s revela o loop; apenas volume oscilando parece respiração | Gravação de margem do lago/mar como base |
| Fogo | Ruído grave de combustão + estalos esparsos com distribuição irregular | Sequência uniforme de clicks parece pipoca digital | Complemento discreto; gravação para o primeiro plano |
| Areia | Contato grave do pé, grãos curtos, fricção no arrasto; variação entre calcanhar e ponta | Ruído longo demais vira lixa/gravel; passo sem peso não convence | Foley caseiro primeiro |
| Água rasa | Contato + ruído de splash, pequenos pingos e ressonâncias amortecidas de bolhas | Bolhas senoidais demais soam cartoon; nenhum deslocamento d'água parece só areia molhada | Foley em recipiente largo primeiro |
| Madeira | Impacto grave + modos ressonantes amortecidos e rangido eventual | Nota afinada repetida parece xilofone | Gravar tábua/piso e usar síntese só para variar corpo |

Ferramentas: [Pure Data](https://github.com/pure-data/pure-data) é bom para montar redes de ruído, filtros e envelopes em tempo real; [Web Audio](https://www.w3.org/TR/webaudio/) tem buffers, filtros, ganhos e AudioWorklet; [Tone.js](https://github.com/Tonejs/Tone.js) oferece Noise/NoiseSynth e agendamento, mas não produz uma floresta realista sozinho. [SuperCollider BrownNoise](https://doc.sccode.org/Classes/BrownNoise.html) e [resonadores](https://doc.sccode.org/Classes/DynKlank.html) servem para modelar impactos e vento. Um [artigo sobre síntese de trovões](https://arxiv.org/abs/2204.08026) aprofunda a modelagem acústica.

O protótipo entregue usa numpy/scipy e grava PCM16 em 48 kHz. Há oito resultados, em `gerador/saida/`, gerados de verdade; `medidas.json` registra tempo e seed. Veja [gerador/README.md](gerador/README.md) para reproduzir e para as limitações. Não há chiptune, ondas quadradas, trilha musical ou amostra externa no gerador.

## IA: pesos e código não são a mesma licença

Não use a licença MIT do programa como prova de que os pesos são comerciais. Os modelos abaixo foram verificados pelas páginas oficiais. Não houve instalação de modelos gigantes nem geração local de IA nesta entrega; tempos publicados não são medições deste Mac.

| Modelo / fonte oficial | Pesos e uso comercial | Mac e instalação | Qualidade / duração / velocidade |
|---|---|---|---|
| [Stable Audio Open 1.0](https://huggingface.co/stabilityai/stable-audio-open-1.0) | A versão atual aponta à Stability AI Community License; uso comercial condicionado aos termos/revenue. Não usar textos de licença de um PR antigo | `stable-audio-tools`; exemplo oficial usa CUDA/CPU. MPS exige adaptação e validação, não é garantia automática | Até 47 s, estéreo 44,1 kHz; vocais pouco realistas. Mais adequado a Foley/ambientes que a fala; tempo local não medido |
| [Stable Audio Open Small](https://huggingface.co/stabilityai/stable-audio-open-small) | Community License, uso comercial condicional; confirmação também no [anúncio oficial](https://stability.ai/news-updates/stability-ai-and-arm-release-stable-audio-open-small-enabling-real-world-deployment-for-on-device-audio-control) | Cerca de 0,5B parâmetros; `stable-audio-tools`, CPU; acesso a pesos exige aceitar condições na conta HF | Até 11 s, inglês; inferência oficial de 8 passos. Promissor para efeito isolado, não para falas ou grande sequência |
| [Stable Audio 3 Small-SFX](https://github.com/Stability-AI/stable-audio-3) | Community License. [Condições comerciais](https://stability.ai/license): abaixo de US$1 milhão de receita anual, sujeito às obrigações; acima, Enterprise | Caminhos oficiais de CPU LiteRT e Apple Silicon MLX/CoreML. Melhor candidato atual; passo a passo em [IA.md](IA.md) | 433M parâmetros, até 120 s. O projeto publica benchmark otimizado: 5 s de áudio em 0,70 s na coluna Mac CPU, sem incluir download. Não extrapolar para este Mac ou para PyTorch |
| [AudioGen / AudioCraft](https://github.com/facebookresearch/audiocraft) | **Pesos CC BY-NC 4.0**, código MIT. Excluído de produção comercial | Python/PyTorch, exemplos GPU; CPU pode ser lenta, MPS depende de operações. Setup acadêmico não recomendado aqui | Sons reconhecíveis em cenas curtas; pode misturar eventos e temporalidade. Tempo local não medido |
| [AudioLDM](https://huggingface.co/cvssp/audioldm-s-full-v2), [AudioLDM2](https://huggingface.co/cvssp/audioldm2) | Checkpoints consultados **CC BY-NC-SA 4.0**. Excluídos mesmo que o código tenha licença permissiva | Diffusers/PyTorch; MPS possível em pipelines compatíveis. Não instalar para este uso | Pode criar ambientes e Foley; qualidade e continuidade variam, especialmente eventos simultâneos. Tempo local não medido |
| [TangoFlux](https://huggingface.co/declare-lab/TangoFlux) | A página declara checkpoints para **pesquisa não comercial** e remete a licenças de dados/Stable Audio. Excluído | Python/PyTorch; não confundir suporte técnico com licença | Até 30 s/44,1 kHz; não testado localmente |

A licença Community não é CC0 nem uma licença open source irrestrita. A receita relevante é a da pessoa/organização, não só a deste canal. Leia a licença do checkpoint exato e cumpra registro/avisos aplicáveis antes do uso comercial. Não foi presumido o faturamento do dono do projeto. [Licenciamento oficial](https://stability.ai/license).

### Serviços: custos e limites verificados

| Serviço | Preço / consumo consultado em 12/10/2026 | Comercial | Quando usar |
|---|---|---|---|
| [ElevenLabs](https://elevenlabs.io/pricing) | Starter US$6/mês, 30 mil créditos; há promoção temporária de primeiro mês. SFX: 200 créditos quando duração automática; [documentação](https://elevenlabs.io/docs/overview/capabilities/sound-effects) indica 40 créditos/s com duração definida | Plano pago inclui licença comercial; gratuito não deve ser usado para anúncio. [Direitos de publicação](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform) | Evento difícil de encontrar, controle de duração/loop. 30 efeitos de 5 s = 6 mil créditos; 30 de 20 s = 24 mil, pela tarifa por segundo. Não gaste os créditos de voz sem planejar |
| [Adobe Firefly](https://www.adobe.com/products/firefly/plans.html) | Standard anunciado a US$9,99/mês e 2 mil créditos. [Tabela de consumo](https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html): SFX 48 kHz, 10 créditos/geração | Modelo Adobe oferece caminho comercial, conforme seus termos e status da ferramenta; não presumir termos iguais para modelos parceiros | Foley sincronizado a gesto/voz, efeito isolado. [Como gerar](https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/text-to-sound-effects.html) |
| [Stable Audio hospedado](https://stableaudio.com/pricing) | Página de preço depende da aplicação e não expôs tabela verificável na consulta. **Preço/quantidade não confirmados**, portanto não reproduzo valores de agregadores | [Guia oficial atual](https://kb.stability.ai/knowledge-base/stable-audio-commerical-and-usage-licensing) permite uso comercial sob termos/AUP, inclusive nos planos citados ali; não reutilizar termos históricos de 2023 como atuais | Sons e ambientes, se aceitar contratar na interface; confirmar preço e consumo antes de gerar |

Não foi comprada assinatura nem foram consumidos créditos pagos. Exemplos de prompt para futura comparação: `Ancient outdoor market crowd, distant unintelligible murmuring, no music, no engines, stone footsteps`; `Quiet open hillside at dawn, sparse small birds, gentle wind in grass, no traffic, no speech`; `Short cloth air swish, dry, no cinematic boom`.

## Foley com celular: sessão de 20 minutos

Estas são orientações práticas de produção, não condições de licença. [Gravador do iPhone](https://support.apple.com/en-ie/guide/iphone/iph4d2a39a3b/ios) permite gravar e exportar; escolha qualidade sem perdas quando disponível.

- Desligue ventilador/TV, ative não perturbe e apoie o celular. Registre 10 s do silêncio do local antes de cada série.
- Mantenha microfone a aproximadamente 20 a 50 cm, fora do jato de ar e do caminho do pé. Faça um teste forte para detectar distorção; afaste antes de gravar a tomada boa.
- Areia: bandeja larga com areia seca. Grave seis contatos separados, seis arrastos e uma caminhada, com variações de peso. Sandália real dá a aderência certa.
- Água: bacia larga e rasa, celular seco e afastado. Grave entrada do pé, retirada, respingo isolado e remo passando. Balde estreito dá ressonância artificial; nunca mergulhe o aparelho.
- Roupa: linho/algodão perto do mic, seis movimentos curtos. Gravar tecido real é melhor que soprar para simular whoosh.
- Madeira: tábua/piso com peso real; depois abra/feche uma porta devagar. Moedas: peças soltas em tecido e madeira, sem som de caixa registradora.
- Barro: pousar uma peça de cerâmica já serve; não precisa quebrar um jarro. Galho: torção, folhas e estalo em tomadas separadas.
- Multidão: grave vozes consentidas em várias tomadas sem palavras completas. Misture distâncias; não capture rádio/música ao fundo. Não imite um mercado antigo usando anúncios modernos.
- Nomeie por material e tomada, preserve o original e só depois corte. Não use redução de ruído agressiva: ela pode apagar gotas e consonantes do murmúrio.

## Tratamento e verificação

O lote usa WAV PCM16/48 kHz. Normalização de pico a -6 dBFS deixa folga para somar efeitos; não pretende igualar loudness percebido de chuva e impacto. Ambientes podem receber emendas cruzadas para repetição; `loop` só é verdadeiro quando essa preparação foi feita. Efeitos pontuais mantêm a cauda e recebem fades curtos contra clicks. Todas as transformações e fontes estão em `fontes/proveniencia.json` e nos scripts.

Não promovo o resultado de um medidor a prova auditiva. A validação entregue verifica leitura/decodificação, duração, amplitudes, silêncio, caminhos, IDs, licença e emendas. A audição humana final deve conferir palavras reconhecíveis, música acidental e timbre no celular junto da dublagem. A densificação/filtragem do murmúrio reduz inteligibilidade, mas não equivale a uma garantia linguística universal.

## Resumo em 10 linhas

1. Comece pelos arquivos indicados em EP03.md.
2. A esquina tem gente ao fundo e passos na pedra.
3. O monte usa pássaros e vento baixo.
4. Há um whoosh e um impacto curto para os cortes.
5. Os sons são realistas; não há música de videogame.
6. Os arquivos comerciais com crédito já têm texto pronto em CREDITOS.md.
7. A BBC gratuita não pode entrar no vídeo monetizado.
8. Grave areia e água com o celular para conseguir passos melhores.
9. O gerador é um experimento útil, principalmente para vento e chuva.
10. Confira os sons junto das falas e baixe o volume do ambiente quando Jesus falar.
