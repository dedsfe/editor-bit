# Assets OQJF: padrão 8-bit

Todo personagem é um **grid de letras** (cada letra = 1 pixel, `.` = transparente), igual à engine (`engine/src/skins/`).
Referência oficial: `referencia/jesus-parado.json` (20×23 px). Rodando `python3 tools/render.py arquivo.json`, ele vira PNG transparente (1x) + preview ampliado 16x.

## Regras do estilo
- Mesmo tamanho de cabeça e corpo do Jesus de referência. Altura máxima de 26 px e largura máxima de 24 px por estado.
- **Só as letras da paleta**, sem inventar cor nova sem necessidade:
  `H` cabelo/barba · `S` pele · `E` olho · `M` boca aberta · `W` túnica branca · `R` faixa vermelha · `L` cinto · `T` cajado · `D` sandália
- Contorno sem preto: o volume vem da luz da engine (normal map), não de sombra desenhada.
- Olhos sempre nas mesmas letras `E` e boca na região da barba, pro lip-sync funcionar.

## Regras de fé (Assembleia de Deus)
- **Nunca auréola, halo ou círculo de luz.** Nada de gesto de bênção com dois dedos, nada de estética católica.

## Formato do arquivo
```json
{ "name": "jesus-xxx", "palette": { ...mesma da referência... }, "grid": ["....", "...."],
  "eyes": [[x,y],[x,y]], "mouth": [[x,y],[x,y]] }
```
