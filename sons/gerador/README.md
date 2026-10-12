# Protótipo procedural

Execute da raiz do projeto:

```sh
python3 -m venv sons/gerador/.venv
sons/gerador/.venv/bin/pip install -r sons/gerador/requirements.txt
sons/gerador/.venv/bin/python sons/gerador/gerar.py
```

Nesta entrega foi usado o Python já disponível, numpy 2.4.4 e scipy 1.17.1. O gerador aceita `--seed 20261012` e `--saida sons/gerador/saida`. Os oito WAV foram produzidos em 0,532 s nesta execução; versões/hardware diferentes mudam o tempo. Pico a -6 dBFS, mono, PCM16/48 kHz, fades curtos. Nenhum arquivo externo foi usado. Os resultados experimentais não entram no manifesto de gravações.

## Avaliação honesta

Não houve escuta humana certificada. Esta avaliação descreve o potencial e os defeitos conhecidos do algoritmo, não inventa uma audição.

| Resultado | Potencial | Limitação da receita |
|---|---|---|
| Vento | Melhor candidato para cama discreta | Modulação ainda simplificada, sem interação espacial real |
| Chuva | Plausível ao fundo | Gotas não modelam a superfície onde caem |
| Trovão | Reforço grave aproveitável | Reflexões finitas e cauda simples tendem a impacto sintético |
| Ondas | Só cama distante | Período fixo de 5 s pode denunciar repetição; não há água residual física |
| Passos na areia | Protótipo, preferir Foley | Granulação pode parecer lixa, contato simplificado |
| Passos na água | Mais provável de soar falso | Bolhas tonais e splash simplificado; preferir água real |
| Passos na madeira | Demonstração dos modos ressonantes | Tendência a batida afinada, não piso real |
| Fogo | Complemento de estalos | Sem variedade de combustível e microexplosões físicas |

Compare cada arquivo com uma gravação da categoria em `../biblioteca/`, igualando **volume percebido**, sem tornar o efeito experimental mais alto para parecer melhor. Ouça com fones e alto-falante de celular. Os arquivos não são loops prontos: repita com crossfade, não com corte seco.

Receitas são implementação original inspirada em princípios gerais de áudio procedural. Referências e licenças de ferramentas em [PESQUISA.md](../PESQUISA.md).
