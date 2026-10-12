Os áudios do EP01 estão prontos em `audio/ep01/`: 12 arquivos `.m4a` com os mesmos ids do roteiro (`roteiros/ep01-pedro-nas-aguas.md`).
- Já estão limpos: ruído reduzido, volume normalizado em -16 LUFS e 0,5 s de silêncio antes e depois de cada fala.
- A legenda tem que seguir o que foi FALADO, que muda um pouco do roteiro em 4 falas:
  - 02-pedro: "Mermão, esse vento tá de brincadeira com a gente!"
  - 08-jesus: "Venha, Pedro." (no roteiro era "Vem.")
  - 10-pedro: "Ih… olha o tamanho dessa onda… Senhor, me ajuda!" (no roteiro era "salva-me")
  - 12-andre: "Uai… verdadeiramente tu é o Filho de Deus."

Assim que o MVP da fogueira fechar, monta o EP01 completo com esses áudios.

Pensando no futuro: estrutura os personagens como **skins**. Cada personagem (Jesus, Pedro, André…) fica num arquivo de dados próprio (sprite em camadas + paleta + boca pro lip-sync), e a engine anima qualquer skin do mesmo jeito. Mais pra frente a gente quer um editor visual em cima disso, mas agora é só deixar a estrutura pronta, sem construir o editor.
