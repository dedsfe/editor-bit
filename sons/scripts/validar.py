#!/usr/bin/env python3
"""Auditoria real dos arquivos finais, sem alterar engine/editor."""
from pathlib import Path
import json,hashlib,subprocess
import numpy as np
from scipy.io.wavfile import read
ROOT=Path(__file__).resolve().parents[1]

def main():
 manifest=json.loads((ROOT/'manifest.json').read_text());ids=set();paths=set();measures=[];errors=[]
 required={'id','arquivo','tags','duracao','fonte','autor','licenca','exige_atribuicao','loop'}
 for m in manifest:
  assert required<=m.keys(),m
  assert m['id'] not in ids,m['id'];ids.add(m['id'])
  p=ROOT/m['arquivo'];assert p.resolve().is_relative_to((ROOT/'biblioteca').resolve())
  assert p.exists(),p;paths.add(p.resolve())
  assert isinstance(m['exige_atribuicao'],bool) and isinstance(m['loop'],bool)
  assert isinstance(m['duracao'],(float,int)) and m['duracao']>0
  assert m['autor'] and m['fonte'].startswith('https://')
  assert m['licenca'] in ['CC0 1.0','Public Domain','CC BY 3.0','CC BY 3.0 + CC0 1.0']
  sr,x=read(p);assert sr==48000 and x.dtype==np.int16 and x.ndim==2 and x.shape[1]==2
  x=x.astype(float)/32768;dur=len(x)/sr;peak=np.max(np.abs(x));rms=np.sqrt(np.mean(x*x))
  assert abs(dur-m['duracao'])<.00001
  assert .499<peak<.503,(m['id'],peak)
  assert rms>.0001,m['id']
  assert hashlib.sha256(p.read_bytes()).hexdigest()==m['sha256']
  subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True,capture_output=True)
  jump=float(np.max(np.abs(x[0]-x[-1])));dc=float(np.max(np.abs(x.mean(axis=0))))
  if m['loop'] and jump>.02:errors.append(f"Emenda brusca {m['id']}: {jump}")
  measures.append({'id':m['id'],'duracao':round(dur,6),'pico_dbfs':round(float(20*np.log10(peak)),3),'rms_dbfs':round(float(20*np.log10(rms)),3),'salto_emenda':round(jump,6),'dc':round(dc,6)})
 actual={p.resolve() for p in (ROOT/'biblioteca').rglob('*.wav')}
 assert paths==actual,{'sem_manifesto':[str(p) for p in actual-paths]}
 assert {'ep03_esquina_mercado','ep03_monte_amanhecer','multidao_murmurio','passos_pedra','passaros_manha','vento_leve','whoosh_transicao','impacto_curto'}<=ids
 procedural=[]
 for p in sorted((ROOT/'gerador/saida').glob('*.wav')):
  sr,x=read(p);assert sr==48000 and x.dtype==np.int16 and np.max(np.abs(x.astype(float)))>0
  procedural.append(p.name)
 assert {'chuva.wav','trovao.wav','vento.wav','ondas.wav','passos_areia.wav','passos_agua.wav'}<=set(procedural)
 assert not errors,errors
 report={'data':'2026-10-12','biblioteca':len(manifest),'procedural':len(procedural),'status':'aprovado nas verificações técnicas','escuta_humana':'não realizada; necessária para certificação perceptiva/linguística','erros':errors,'medidas':measures}
 (ROOT/'VALIDACAO.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='medidas'},ensure_ascii=False))
if __name__=='__main__':main()
