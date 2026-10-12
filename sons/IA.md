# IA local no Apple Silicon

**Nenhum modelo de IA foi executado nesta entrega.** O ambiente é arm64, mas os pesos não foram baixados. A recomendação técnica é testar primeiro Stable Audio 3 Small-SFX pelo runtime oficial de CPU; isso não significa que qualidade e velocidade tenham sido medidas neste Mac.

## Licença antes da instalação

[Stability AI Community License](https://stability.ai/license) permite uso comercial condicionado aos termos e ao limite de receita anual da organização. Acima de US$1 milhão, procure a licença Enterprise. Verifique o checkpoint e os requisitos de registro/avisos em sua própria conta. Não assuma que os pesos sejam CC0 ou que uma assinatura do site licencie todos os modelos locais.

Fontes: [modelo Small-SFX](https://huggingface.co/stabilityai/stable-audio-3-small-sfx), [runtime oficial](https://github.com/Stability-AI/stable-audio-3/tree/main/optimized/tflite). Não usar AudioGen, AudioLDM/2 ou TangoFlux em anúncios: veja a comparação de licenças em [PESQUISA.md](PESQUISA.md).

## Instalação proposta, ainda não testada

Os comandos abaixo mantêm checkout, ambiente e cache dentro de `sons/`. Execute da raiz do OQJF depois de verificar/aceitar a licença do modelo. Não há necessidade de alterar a engine.

```sh
mkdir -p sons/ia-local/cache
export HF_HOME="$PWD/sons/ia-local/cache"
git clone --depth 1 https://github.com/Stability-AI/stable-audio-3.git sons/ia-local/stable-audio-3
cd sons/ia-local/stable-audio-3/optimized/tflite
./install.sh
```

O instalador oficial é interativo e cria um ambiente local. Escolha somente **sm-sfx**, não medium/music. Se pedir autenticação do Hugging Face, faça o login local e aceite o acesso na página oficial; não coloque tokens em arquivos do projeto ou no chat. O download inicial e a instalação não estão incluídos nos benchmarks. Registre `git rev-parse HEAD` para reproduzir a versão instalada.

Confira a interface antes de gerar:

```sh
./sa3 --help
mkdir -p ../../../../teste-ia
./sa3 --dit sm-sfx --prompt "Quiet open hillside at dawn, gentle breeze in grass, sparse small birds, no music, no traffic, no speech" --seconds 8 --out ../../../../teste-ia/monte.wav
```

As opções `--seconds`/`--out` devem ser confrontadas com `--help` da revisão instalada. O relatório do runtime e o [README principal](https://github.com/Stability-AI/stable-audio-3) fornecem suporte oficial a CPU/macOS e um caminho alternativo MLX para Apple Silicon. Não trocar automaticamente `cuda` por `mps` em um exemplo de outro modelo.

## Critério de aprovação

Cronometre a segunda execução, depois do download, e anote chip, RAM, revisão, seed e parâmetros. Ouça o resultado junto da dublagem. Rejeite vozes reconhecíveis, música, motores, assobios sintéticos e mudanças bruscas. Se não superar as gravações deste lote, não leve à produção. Guarde arquivo e licença antes de incluir no manifesto.

Para Stable Audio Open 1.0/Small, a [biblioteca oficial](https://github.com/Stability-AI/stable-audio-tools) e as model cards mostram instalação com PyTorch e exemplos CPU/CUDA. O Small antigo limita os clips a 11 s. É uma alternativa documentada, com suporte MPS a validar, não uma instalação comprovada por esta entrega.
