Pode seguir com o MVP de 10 s. WebGL2 próprio aprovado, a versão C (com normal map) é o caminho.

Ajustes visuais pro MVP:
1. **Jesus maior.** No 9:16 ele tá pequeno demais pro celular. Ele tem que ocupar ~30–35% da altura da tela, centralizado. Respeita a safe area do TikTok: os ~20% de baixo e a lateral direita ficam cobertos pela interface.
2. **Fogueira mais perto e maior**, pra luz quente bater forte no rosto e na roupa. O efeito do normal map precisa ficar óbvio numa tela pequena.
3. **Menos céu vazio:** horizonte mais alto, estrelas menos densas, com brilhos diferentes e piscando de leve.
4. **Chão menos granulado:** esse ruído vira "chiado" quando o TikTok comprime o vídeo. Usa um dither ordenado ou uma textura de pixel art mais limpa.

Depois do MVP, o próximo é o **EP01**. Lê `roteiros/ep01-pedro-nas-aguas.md` pra já ir planejando:
- Mar da Galileia de madrugada com tempestade: ondas, chuva, relâmpago como luz que pisca e revela a cena, barco balançando.
- Sprites novos no mesmo estilo do Jesus: **Pedro** e **André**.
- Ações: Jesus andando sobre a água, Pedro descendo do barco, contador de passos na tela, Pedro afundando, mão de Jesus segurando com luz forte, vento parando e amanhecer.
- Os áudios vão chegar em `audio/ep01/<id>.m4a`, com os ids do roteiro (01-andre, 02-pedro…).
