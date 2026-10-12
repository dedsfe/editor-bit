# Pedidos para a engine · editor v1

Nenhum arquivo de `engine/` foi alterado. O editor importa o Renderer WebGL2, normalMap, composeSkin, Timeline, SKINS e SETS diretamente.

| Pedido | Adaptação atual em `editor/` |
| --- | --- |
| Publicar skins Pedro e André no registro SKINS | `src/engine-adapter.ts`: derivações da skin Jesus, com paletas próprias e sem cajado. O registro da engine tem prioridade quando essas skins forem adicionadas. |
| Publicar o cenário `galilee` em SETS | Cenário pixel art local, desenhado pelo Renderer da engine. Um futuro SETS.galilee substitui automaticamente esse fallback. |
| Biblioteca de props reutilizáveis: barco, fogueira, pedra, palmeira | Grids pixel art e normal maps locais, desenhados via billboard. A fogueira acrescenta luz pontual. |
| Scene/Build com início absoluto, trimIn, trimOut e volume por clip, incluindo splits e sobreposições | `src/model.ts` mantém um formato de projeto versionado. O adaptador reconstrói Build e resolve referências das ações usando todas as partes de uma fala dividida. |
| Player/compositor com overrides editáveis de luzes, props e seleção/projeção inversa | O adaptador usa diretamente Renderer + Timeline, aplicando as propriedades do projeto. A engine continua responsável por iluminação, normal maps e sombras. |
| Export MP4 público que aceite o compositor e a montagem editada de áudio | `src/export.ts` gera os mesmos frames usados no preview. A API do Vite em `vite.config.ts` usa FFmpeg local para H.264/AAC 1080×1920, 30 fps, upscale nearest-neighbor. Não é uma API de export da engine. |
| Ações do roteiro para afundar/estender a mão/segurar Pedro | Cue atual oferece walk/face/camera/shake. O exemplo usa a caminhada de Pedro pela Timeline; afundamento e resgate ainda dependem de ações na engine. |

Limites respeitados: três personagens; até sete luzes pontuais mais uma principal; até quatro casters no renderer atual (sombras dos três personagens). Props têm iluminação, mas não são adicionados como casters. A boca usa uma abertura simples durante a fala; análise de lip-sync fica fora do v1.
