O MVP da fogueira ficou lindo, aprovado! Agora é o **EP01 completo**: Pedro andando sobre as águas.

## Material
- Roteiro: `roteiros/ep01-pedro-nas-aguas.md` (cenas, ações e textos de tela).
- **Áudio com a MINHA voz:** `audio/ep01/01-andre.m4a` … `12-andre.m4a` (já limpos e normalizados). Nada de TTS neste episódio.
- A legenda segue o que foi FALADO. Muda do roteiro em 4 falas:
  - 02-pedro: "Mermão, esse vento tá de brincadeira com a gente!"
  - 08-jesus: "Venha, Pedro."
  - 10-pedro: "Ih… olha o tamanho dessa onda… Senhor, me ajuda!"
  - 12-andre: "Uai… verdadeiramente tu é o Filho de Deus."
- Referência de clima e cor (só a paleta e a luz, não é asset): `testes/gemini/cena-ep01.png`. **Ignora a auréola dessa imagem, ela está errada.**

## O que fazer
1. **Skins novas** em `engine/src/skins/`, no mesmo estilo do Jesus: **Pedro** (mais velho, barba escura e cheia, túnica marrom, jeitão exagerado) e **André** (mais novo, barba curta, túnica bege/oliva). Os dois com boca pro lip-sync e olhos piscando.
2. **Cenário `galilee`** em SETS: mar à noite com ondas animadas, chuva, relâmpago (luz que pisca e ilumina tudo), barco de madeira balançando, e o **amanhecer** no final (céu clareando, vento parando).
3. **Ações novas:** andar sobre a água, descer do barco, afundar aos poucos, estender a mão / segurar (com um brilho quente nas mãos), subir no barco.
4. **Tela:** texto-gancho no início, contador "PASSOS: 1… 2… 3…" que congela quando Pedro olha pra onda, os balões, e os 3 cards do final que estão no roteiro.
5. Exporta `engine/out/ep01.mp4` (9:16, com o meu áudio) + uma folha de frames, e abre o preview no navegador.

## Regras de fé (Assembleia de Deus, é sério)
- **Jesus SEM auréola, SEM halo, SEM círculo de luz atrás da cabeça.** Nada de estética católica. Se tiver luz perto dele, é só a luz natural da cena.
- As falas de Jesus são só o que está no áudio. Não inventa texto pra ele.

## Coordenação com o editor
O Codex está construindo o editor em `editor/` e ele **importa da engine**: Renderer, normalMap, composeSkin, Timeline, SKINS e SETS. **Não renomeia nem quebra esses exports.** Lê o `editor/ENGINE-NEEDS.md`: ele espera as skins com os nomes `pedro` e `andre` em SKINS, o cenário `galilee` em SETS e as ações de afundar/estender a mão/segurar no Cue. Usa esses nomes que o editor troca os stubs dele pelos seus automaticamente.
