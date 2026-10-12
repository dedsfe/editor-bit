# Sons OQJF

**32 arquivos na biblioteca:** 30 efeitos/ambientes base tratados e duas composições para o EP03. Mais oito WAV procedurais para comparar. Licenças comerciais verificadas por arquivo: CC0 1.0, CC BY 3.0 ou Public Domain. Os itens BY exigem os créditos fornecidos.

- [EP03.md](EP03.md): arquivos prioritários e plano de montagem da esquina, monte, transição e impacto.
- [manifest.json](manifest.json): catálogo para futura integração, sem alterações no editor. É uma lista JSON; caminhos relativos a `sons/`, duração em segundos, `loop` booleano.
- [PESQUISA.md](PESQUISA.md): bibliotecas, síntese, IA, custos, licenças e Foley; termina com dez linhas diretas.
- [CREDITOS.md](CREDITOS.md): bloco EP03 e atribuição completa para publicar.
- [COBERTURA.md](COBERTURA.md): substitutos e sons que ainda faltam na lista extensa.
- [IA.md](IA.md): instalação local proposta a partir da documentação oficial, ainda não testada.
- [gerador/README.md](gerador/README.md): execução e limitações do protótipo procedural.
- [VALIDACAO.json](VALIDACAO.json): medidas técnicas de cada arquivo.

## Reproduzir o tratamento

Na raiz do projeto, com ffmpeg, Python, numpy e scipy disponíveis:

```sh
python3 sons/scripts/montar.py
python3 sons/scripts/creditos.py
python3 sons/scripts/validar.py
python3 sons/gerador/gerar.py
```

O primeiro comando reutiliza originais já baixados em `fontes/`; se faltar um WAV, baixa pelo link público verificado da SoundBible. Os arquivos Kenney usados e sua licença acompanham o lote. Não usa API ou autenticação do Freesound. O gerador experimental pode ser instalado num ambiente próprio conforme seu README.

Para ouvir um arquivo no Mac:

```sh
afplay sons/biblioteca/ambiente/ep03_esquina_mercado.wav
```

A normalização é de pico (-6 dBFS), não de volume percebido: ajuste os ganhos junto das falas. A validação automática passou, mas não houve escuta humana; a ausência de palavras reconhecíveis no murmúrio precisa ser conferida na mix final. Não houve geração de IA local nem gasto em serviços pagos.

## Proveniência

`fontes/proveniencia.json` guarda fonte, licença, autor, hash dos originais e tratamento. O manifesto guarda hash dos finais e, nas composições, todas as páginas componentes em `fontes`. Há páginas de candidatos rejeitados preservadas para pesquisa; apenas `biblioteca/` + `manifest.json` formam a seleção de produção. Os originais são material de trabalho, não arquivos adicionais para usar sem olhar a licença.

Somente `sons/` foi escrito. Nenhum commit foi feito. Alterações preexistentes em engine, editor e projetos foram preservadas.
