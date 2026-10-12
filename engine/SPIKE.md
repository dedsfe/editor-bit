# Spike: PixiJS v8 vs WebGL2 puro

Imagem: `docs/spike-comparacao.png` (A = Pixi, B = WebGL2 sem/com normal map).

| | PixiJS v8 | WebGL2 próprio |
|---|---|---|
| Luz + normal map no sprite | dá, com Filter próprio | dá |
| Chão iluminado + sombra projetada | teria que reescrever o mesmo shader em cada objeto | pronto (sombra calculada no shader do chão) |
| Plugin de luz pronto | `@pixi/lights` só funciona na v7 | — |
| Fácil pra IA mexer | filtro roda em "espaço de filtro" (converter coordenada na mão, API muda entre versões) | 1 arquivo de shader, coordenada = pixel do mundo |

**Decisão:** engine própria em WebGL2 (`src/core/renderer.ts`). Pixi não traz nada que a gente usaria:
toda a parte difícil (luz, normal, sombra, HDR) é shader nosso de qualquer jeito.
