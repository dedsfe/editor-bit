Nova frente: **editor visual v1 (MVP)** em cima da nossa engine. O plano completo do v1 ao v10 está em `roadmap/editor.md`. Lê o arquivo, mas constrói **só o v1**.

Ordem:
1. Termina o que está em andamento (MVP da fogueira com export MP4).
2. Faz o editor v1.
3. Monta o EP01 (`roteiros/ep01-pedro-nas-aguas.md` + `audio/ep01/`) **dentro do editor**. Esse é o teste de que o v1 funciona.

Requisitos técnicos:
- O preview do editor **é a própria engine** (mesmo renderer do export). Mexeu no editor, o MP4 sai igual.
- Projeto salvo como `.json` (o mesmo formato de cena que a engine já lê), em `projetos/`.
- Personagens como skins (`src/skins/`), trocáveis com 1 clique.
- Pode usar React ou o que achar melhor pra UI. Prioridade: simples e rápido de usar, não bonito.
- Mostra screenshot a cada avanço.
