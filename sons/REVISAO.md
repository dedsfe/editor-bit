# Revisão final do brief e das instruções

## Entregas

| Exigência | Resultado verificado |
|---|---|
| Pesquisa em português, buscas numerosas e links oficiais | PESQUISA.md compara as 11 bibliotecas citadas mais SoundBible, técnicas, modelos e serviços |
| Licença comercial de cada som | SoundBible: BY 3.0 ou Public Domain; Kenney: CC0. Páginas individuais, licença do pack e hashes arquivados |
| Lote baixado de verdade | Originais WAV/OGG presentes, 30 entradas base e 2 composições, organizadas nas seis categorias |
| Corte / normalização | PCM16/48 kHz estéreo, pico -6 dBFS; processamento reproduzível |
| EP03 com prioridade | Esquina e monte compostos, mais camadas separadas, whoosh e impacto |
| Manifesto | Uma entrada por WAV final, todos os campos pedidos, IDs únicos, duração conferida e nenhuma sobra na biblioteca |
| Créditos publicáveis | Bloco EP03 e lista completa, títulos, autores, URLs, licença e transformações |
| Procedural | 8 resultados gerados, incluindo os 6 obrigatórios, seed e tempo registrados |
| Avaliação honesta | Potencial/defeitos de síntese documentados; não foi inventada escuta humana |
| IA | Comparação de pesos e instruções locais; teste de IA não executado, não apresentado como validado |
| Resumo de dez linhas | Último bloco de PESQUISA.md |
| Escopo | Todas as gravações e arquivos novos em sons; nenhum commit, nenhuma edição em engine/editor |

## Correções feitas na revisão

- A gravação candidata de passos na SoundBible mencionava carros. Foi descartada da biblioteca; o EP03 usa sequência de cinco tomadas secas de concreto Kenney.
- A fonte gratuita de risada de multidão encontrada tinha Personal Use Only; foi excluída. A entrega usa risada de ator sob BY 3.0 e informa o substituto.
- A gravação de remo encontrada tinha Sampling Plus; não entrou no lote.
- Vento e pássaros não foram apresentados como gravações do local bíblico: as adaptações e origens estão descritas.
- Três emendas apresentaram saltos de amplitude. Foram refeitas com crossfade e microfades; o salto entre a primeira e a última amostra agora é zero em todos os loops.
- Foram conferidos decodificação, amplitudes, duração, IDs, caminhos, campos, licença e correspondência dos hashes. A validação aprovada está em VALIDACAO.json.
- A opção de saída do runtime de IA foi confrontada com o código oficial: `--out`. A instalação continua explicitamente não testada.

## Lei de design fornecida

A lei foi relida ponto a ponto. Esta entrega não constrói interface: não há hero, nav, cards, fontes de marca, imagens, logos, sombras, grids, glass, gradientes, botões, controles ou animações. Os critérios visuais correspondentes não se aplicam. Nos critérios que se aplicam a documentação/artefatos: foram usados nomes específicos, links reais, linguagem direta, tabelas para comparações, nenhum depoimento/cliente/métrica inventado e distinção explícita entre resultado medido e inferência. Não existe controle visual de demonstração que prometa interação falsa.

O trabalho não está certificado por audição humana. A qualidade perceptiva dos loops, o timbre dos substitutos e a inteligibilidade do murmúrio devem ser ouvidos com a dublagem antes da publicação. Isso é uma limitação declarada, não uma etapa que a validação numérica possa substituir.
