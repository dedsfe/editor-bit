#!/usr/bin/env python3
"""Monta lote auditável. Executar da raiz: python3 sons/scripts/montar.py."""
from pathlib import Path
import urllib.request,json,re,hashlib,concurrent.futures,subprocess,html
import numpy as np
from scipy.io.wavfile import write
from scipy.signal import butter,sosfilt
ROOT=Path(__file__).resolve().parents[1];SR=48000
SB={v['id']:v for v in json.loads((ROOT/'fontes/soundbible-metadados.json').read_text())}
# ID, pasta, nome, segundos máximos, loop preparado, tags, processamento adicional
PLAN=[
('2163','ambiente','multidao_base',20,False,['multidao','vozes','base'],'base com fala potencialmente legível, usar multidao_murmurio no EP03'),
('2068','efeitos','whoosh_transicao',2,False,['whoosh','transicao','ep03'],''),
('1827','ambiente','passaros_manha',20,True,['passaros','amanhecer','ep03'],'pássaros depois da chuva; uso dramático como amanhecer'),
('1810','clima','vento_leve',20,True,['vento','leve','ep03'],'passa-altas 80 Hz, passa-baixas 1300 Hz; suavização para cama distante'),
('1247','clima','vento_forte',20,True,['vento','forte'],''),
('885','agua','ondas_calmas',20,True,['ondas','mar','ep01'],''),
('2100','agua','splash_lago',4,False,['splash','agua','ep01'],''),
('1460','agua','respingo',4,False,['splash','respingo','ep01'],''),
('1137','agua','bolhas_afundando',6,False,['bolhas','submersao','ep01'],'bolhas como substituto de afundamento; não gravação de pessoa afundando'),
('1999','clima','chuva',20,True,['chuva','ep01'],''),
('2217','clima','chuva_forte_vento',20,True,['chuva','vento','tempestade','ep01'],''),
('2015','clima','trovao_perto',10,False,['trovao','tempestade','ep01'],''),
('907','clima','trovao_longe',12,False,['trovao','distante','ep01'],''),
('2083','ambiente','grilos_noite',20,True,['grilos','noite','ep02'],''),
('1902','ambiente','fogueira',20,True,['fogo','fogueira','ep02'],''),
('48','objetos','galho_quebrando',4,False,['galho','estalo','ep02'],''),
('518','objetos','madeira_tensao',5,False,['madeira','rangido','galho','ep02'],'madeira sob tensão; camada possível para barco, sem afirmar gravação de barco'),
('1362','objetos','porta_madeira',5,False,['porta','madeira','ep02'],''),
('2081','objetos','moeda_caindo',3,False,['moedas','metal','ep02'],''),
('520','objetos','ovelha',5,False,['ovelha','animal'],''),
('1282','objetos','leao_rugido',5,False,['leao','animal'],''),
('1483','objetos','leao_rosnado',5,False,['leao','animal'],''),
('2010','efeitos','risada_abafada',4,False,['risada','humor'],'passa-baixas 1600 Hz; risada individual, não plateia inteira'),
('1546','passos','passos_trilha',8,False,['passos','terra','trilha','ep02'],'trilha gravada; não afirmar areia ou sandália'),
]
KEN=[('footstep_wood_000.ogg','passos','passo_madeira',['passos','madeira'],''),('impactSoft_heavy_000.ogg','efeitos','impacto_curto',['impacto','camera','ep03'],''),('impactWood_light_000.ogg','objetos','batida_madeira',['madeira','batida'],''),('impactPlate_light_000.ogg','objetos','ceramica_contato',['ceramica','jarro'],'contato de prato como substituto de jarro, não quebra de barro'),('impactBell_heavy_000.ogg','efeitos','brilho_suave',['brilho','milagre','ep01'],'ressonância filtrada a 1800 Hz; usar muito baixo para não sugerir magia')]

def decode(p):
 b=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar',str(SR),'-ac','2','-f','f32le','-'])
 return np.frombuffer(b,dtype='<f4').reshape(-1,2).astype(np.float64)

def lowpass(x,hz):return sosfilt(butter(3,hz,fs=SR,output='sos'),x,axis=0)

def save(p,x,loop=False):
 x=x.copy();x-=x.mean(axis=0)
 if loop:
  n=min(int(.75*SR),len(x)//8);w=np.linspace(0,1,n)[:,None]
  blend=x[-n:]*(1-w)+x[:n]*w
  x=np.concatenate([x[n:-n],blend])
  # Microfades de 0.67 ms zeram a descontinuidade de amostra na emenda.
  micro=32;w=np.linspace(0,1,micro)[:,None];x[:micro]*=w;x[-micro:]*=1-w
 else:
  amp=np.max(np.abs(x),axis=1);active=np.flatnonzero(amp>max(.0001,np.max(amp)*.012))
  if len(active):x=x[max(0,active[0]-1200):min(len(x),active[-1]+2400)]
  n=min(240,len(x)//4);w=np.linspace(0,1,n)[:,None];x[:n]*=w;x[-n:]*=1-w
 peak=np.max(np.abs(x))
 if not peak>1e-8:raise ValueError('Áudio silencioso: '+str(p))
 x*=10**(-6/20)/peak;p.parent.mkdir(parents=True,exist_ok=True)
 write(p,SR,np.rint(x*32767).astype(np.int16));return len(x)/SR

def baixar(v):
 if v['licenca_pagina'] not in ['Attribution 3.0','Public Domain']:raise ValueError('Licença excluída: '+v['id'])
 p=ROOT/'fontes'/('sb'+v['id']+'.wav')
 if not p.exists():
  with urllib.request.urlopen(v['download'],timeout=60) as r:
   data=r.read()
  if data[:4] not in [b'RIFF',b'RF64']:raise ValueError('Não WAV: '+v['id'])
  p.write_bytes(data)
 return p

def entry(id,cat,dur,source,author,license,loop,tags,notes,original,download=None):
 return dict(id=id,arquivo=f'biblioteca/{cat}/{id}.wav',tags=tags,duracao=round(dur,6),fonte=source,autor=author,licenca=license,exige_atribuicao=license=='CC BY 3.0',loop=loop,notas=notes,original=original,download=download)

def main():
 provenance=[];manifest=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
  raws=list(ex.map(baixar,[SB[r[0]] for r in PLAN]))
 for r,raw in zip(PLAN,raws):
  sid,cat,id,dur,loop,tags,notes=r;v=SB[sid];x=decode(raw);x=x[:int(dur*SR)]
  if id=='vento_leve':x=lowpass(sosfilt(butter(3,80,btype='highpass',fs=SR,output='sos'),x,axis=0),1300)
  if id=='risada_abafada':x=lowpass(x,1600)
  target=ROOT/'fontes/multidao_base_tratada.wav' if id=='multidao_base' else ROOT/f'biblioteca/{cat}/{id}.wav'
  d=save(target,x,loop)
  if id != 'multidao_base':manifest.append(entry(id,cat,d,v['url'],v['autor'], 'CC BY 3.0' if v['licenca_pagina']=='Attribution 3.0' else 'Public Domain',loop,tags,notes,v['titulo'],v['download']))
  provenance.append({**v,'raw':str(raw.relative_to(ROOT)),'sha256_original':hashlib.sha256(raw.read_bytes()).hexdigest(),'tratamento':f'primeiros {dur}s, PCM16 48k estéreo, pico -6 dBFS; '+('emenda circular de até 0.75s + microfades de 0.67ms' if loop else 'trim limiar 1.2% do pico, padding, fade 5ms')+'; '+notes})
  print(id,round(d,2),flush=True)
 for original,cat,id,tags,notes in KEN:
  raw=ROOT/'fontes/kenney-impact/Audio'/original;x=decode(raw)
  if id=='brilho_suave':x=lowpass(x,1800)
  d=save(ROOT/f'biblioteca/{cat}/{id}.wav',x)
  manifest.append(entry(id,cat,d,'https://kenney.nl/assets/impact-sounds','Kenney','CC0 1.0',False,tags,notes,original))
  provenance.append({'id':id,'url':'https://kenney.nl/assets/impact-sounds','licenca_pagina':'CC0 1.0','raw':str(raw.relative_to(ROOT)),'sha256_original':hashlib.sha256(raw.read_bytes()).hexdigest(),'tratamento':'PCM16 48k estéreo, pico -6 dBFS, trim, fade 5ms; '+notes})
 # Passos secos de concreto Kenney: evitar fonte SoundBible que contém carros.
 steps=np.zeros((int(6*SR),2))
 for i,at in enumerate(np.arange(.15,5.6,.55)):
  raw=ROOT/'fontes/kenney-impact/Audio'/f'footstep_concrete_{i%5:03d}.ogg';e=decode(raw)
  start=int(at*SR);end=min(len(steps),start+len(e));steps[start:end]+=e[:end-start]
 d=save(ROOT/'biblioteca/passos/passos_pedra.wav',steps)
 provenance.append({'id':'passos_pedra','url':'https://kenney.nl/assets/impact-sounds','licenca_pagina':'CC0 1.0','originais':[{'raw':f'fontes/kenney-impact/Audio/footstep_concrete_{i:03d}.ogg','sha256_original':hashlib.sha256((ROOT/f'fontes/kenney-impact/Audio/footstep_concrete_{i:03d}.ogg').read_bytes()).hexdigest()} for i in range(5)],'tratamento':'sequência de 5 tomadas, pico -6 dBFS, trim, fades'})
 manifest.append(entry('passos_pedra','passos',d,'https://kenney.nl/assets/impact-sounds','Kenney','CC0 1.0',False,['passos','pedra','concreto','ep03'],'sequência de 5 tomadas de concreto, substituto acústico de calçamento de pedra','footstep_concrete_000..004.ogg'))
 # Walla: sobreposição de cinco trechos deslocados, reversão em duas vozes e filtro.
 crowd=decode(ROOT/'fontes/multidao_base_tratada.wav');n=20*SR
 crowd=np.resize(crowd,(n,2));murmur=np.zeros_like(crowd)
 for i,shift in enumerate([0,3.7,7.9,12.2,16.4]):
  layer=crowd[::-1] if i in (1,3) else crowd
  murmur+=np.roll(layer,int(shift*SR),axis=0)/5
 murmur=lowpass(murmur,900)
 d=save(ROOT/'biblioteca/ambiente/multidao_murmurio.wav',murmur,True)
 manifest.append(entry('multidao_murmurio','ambiente',d,SB['2163']['url'],SB['2163']['autor'],'CC BY 3.0',True,['multidao','murmurio','ep03'],'5 camadas deslocadas, duas reversas, lowpass 900 Hz; inteligibilidade reduzida, conferir na mix','Party Crowd'))
 # Composições úteis para EP03. Misturar cópias já normalizadas com ganho relativo.
 def fit(x,n):return np.tile(x,(int(np.ceil(n/len(x))),1))[:n]
 n=18*SR
 birds=decode(ROOT/'biblioteca/ambiente/passaros_manha.wav');wind=decode(ROOT/'biblioteca/clima/vento_leve.wav')
 monte=fit(birds,n)*.3+fit(wind,n)*.09
 d=save(ROOT/'biblioteca/ambiente/ep03_monte_amanhecer.wav',monte,True)
 manifest.append(entry('ep03_monte_amanhecer','ambiente',d,SB['1827']['url'],'Mike Koenig; Mark DiAngelo','CC BY 3.0',True,['ep03','monte','amanhecer','vento','passaros'],'composição, pássaros + vento suave; não gravação histórica de Israel','Birds After Rain + Wind'))
 manifest[-1]['exige_atribuicao']=True;manifest[-1]['fontes']=[SB['1827']['url'],SB['1810']['url']]
 esquina=fit(decode(ROOT/'biblioteca/ambiente/multidao_murmurio.wav'),n)*.23
 steps=decode(ROOT/'biblioteca/passos/passos_pedra.wav')
 for at in [1,5.1,10.2,14.3]:
  start=int(at*SR);end=min(n,start+len(steps));esquina[start:end]+=steps[:end-start]*.12
 d=save(ROOT/'biblioteca/ambiente/ep03_esquina_mercado.wav',esquina,True)
 manifest.append(entry('ep03_esquina_mercado','ambiente',d,SB['2163']['url'],'Daniel Simion; Kenney','CC BY 3.0 + CC0 1.0',True,['ep03','esquina','mercado','dia','multidao','pedra'],'composição de multidão e concreto; mercado antigo recriado, sem gravação de comércio real','Party Crowd + Kenney footstep_concrete'))
 manifest[-1]['fontes']=[SB['2163']['url'],'https://kenney.nl/assets/impact-sounds'];manifest[-1]['exige_atribuicao']=True
 for m in manifest:
  m['sha256']=hashlib.sha256((ROOT/m['arquivo']).read_bytes()).hexdigest()
 (ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
 (ROOT/'fontes/proveniencia.json').write_text(json.dumps(provenance,indent=2,ensure_ascii=False)+'\n')
 print('Total',len(manifest),flush=True)
if __name__=='__main__':main()
