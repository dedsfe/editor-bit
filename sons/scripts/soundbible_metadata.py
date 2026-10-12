import urllib.request,re,json,concurrent.futures,html,time
from pathlib import Path
names=['2163-Crowd-Talking','2068-Woosh','1661-Sunny-Day','1827-Birds-After-Rain','547-Birds-In-Forest','1810-Wind','1247-Wind','634-Wind-Blowing','885-Sea-Waves','1936-Crisp-Ocean-Waves','2100-Splash-Rock-In-Lake','1460-Water-Splash','1297-Rowing-A-Boat','1137-Bubbles','1571-Fishtank-Bubbles-2','1999-Rain','1192-Light-Rain-And-Crickets','2217-Heavy-Rain-Wind','2015-Thunder-Strike-1','907-Distant-Thunder','2083-Crickets-Chirping-At-Night','1902-Fire-Burning','48-Branch-Break','518-Branch-Wood-Stress-Cracking','1362-Old-Door-Creaking','2081-Coin-Drop','1012-Sheep','520-Sheep-Bleating','1282-Lion-Roar','1483-Lion-Growling','198-Crowd-Laughing','2010-Laughter','2057-Footsteps-On-Cement','911-Footsteps','1546-Hiking-A-Trail','1265-Shopping-Mall-Ambiance']
def f(name):
 u='https://soundbible.com/'+name+'.html';sid=name.split('-')[0];p=Path('sons/fontes/sb'+sid+'.html')
 try:
  s=urllib.request.urlopen(u,timeout=20).read().decode();p.write_text(s)
  title=html.unescape(re.search(r'<h3>(.*?)</h3>',s,re.S)[1]);license=re.search(r'License</h5>\s*<p>(.*?)</p>',s,re.S)[1].strip()
  artist=re.search(r'icofont-user-male.*?<a href="#">(.*?)</a>',s,re.S)
  desc=re.search(r'<meta name="description" content="(.*?)"',s,re.S)
  return dict(id=sid,url=u,titulo=title,licenca_pagina=license,autor=html.unescape(artist[1]).strip() if artist else None,descricao=html.unescape(desc[1]) if desc else '',download='https://soundbible.com/grab.php?id='+sid+'&type=wav')
 except Exception as e:return dict(id=sid,url=u,erro=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:r=list(ex.map(f,names))
Path('sons/fontes/soundbible-metadados.json').write_text(json.dumps(r,indent=2,ensure_ascii=False))
for v in r:print(v['id'],v.get('titulo'),v.get('licenca_pagina'),v.get('autor'),v.get('erro',''))
