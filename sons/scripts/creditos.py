from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'manifest.json').read_text());meta={v['url']:v for v in json.loads((ROOT/'fontes/soundbible-metadados.json').read_text())}
licenseurl='https://creativecommons.org/licenses/by/3.0/'
def sources(items):
 return sorted({u for v in items for u in v.get('fontes',[v['fonte']]) if u in meta and meta[u]['licenca_pagina']=='Attribution 3.0'})
def lines(items):
 return [f"- {meta[u]['titulo']} - {meta[u]['autor']}. Fonte: {u}. Licença: CC BY 3.0 ({licenseurl}). Alterações: corte, normalização e, conforme o arquivo, filtro, reversão, sobreposição e emenda para repetição." for u in sources(items)]
ep03=[v for v in manifest if 'ep03' in v['tags']]
text='# Créditos prontos para publicar\n\nOs arquivos CC0 e Public Domain não exigem atribuição. Os arquivos CC BY exigem crédito, mesmo quando filtrados ou misturados. Copie somente as fontes que aparecem no vídeo, incluindo as das composições. Os blocos abaixo já incluem fonte, autor, título, licença e alterações.\n\n## Bloco para o EP03\n\n'+ '\n'.join(lines(ep03))+'\n\nPassos e impacto: Kenney, Impact Sounds, CC0 1.0. Crédito opcional: https://kenney.nl/assets/impact-sounds\n\n## Bloco completo do lote\n\n'+'\n'.join(lines(manifest))+'\n\n## Fontes sem atribuição obrigatória\n\n'
for v in manifest:
 if not v['exige_atribuicao']:text+=f"- `{v['id']}`: {v['autor']}, {v['licenca']}. {v['fonte']}\n"
text+='\nA licença dos sons não implica endosso dos autores ao canal ou ao app. Nenhum som da BBC, ZapSplat, Mixkit, Pixabay ou modelo não comercial foi incluído.\n'
(ROOT/'CREDITOS.md').write_text(text)
print(len(sources(manifest)),'fontes com atribuição;',len(sources(ep03)),'no EP03')
