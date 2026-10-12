#!/usr/bin/env python3
"""Síntese original, sem amostras externas. Saída PCM16/48 kHz, seed estável."""
from pathlib import Path
import argparse,json,time
import numpy as np
from scipy.signal import butter,sosfilt,lfilter
from scipy.io.wavfile import write
SR=48000

def filtro(x,hz,tipo='lowpass'):
    return sosfilt(butter(3,hz,btype=tipo,fs=SR,output='sos'),x)

def ruido(rng,n,cor='white'):
    x=rng.normal(size=n)
    if cor=='brown':x=lfilter([1],[1,-.995],x)
    if cor=='pink':x=lfilter([.049922,.050612,.050612,.049922],[1,-2.494956,2.017265,-.52219],x)
    return x/(np.std(x)+1e-9)

def pulso(rng,dur=.25,hz=900,decay=15):
    t=np.arange(int(SR*dur))/SR
    return filtro(ruido(rng,len(t)),hz)*np.exp(-t*decay)*(1-np.exp(-t*400))

def adicionar(x,event,start,amp=1):
    i=int(start*SR);n=min(len(event),len(x)-i)
    if i>=0 and n>0:x[i:i+n]+=event[:n]*amp

def sintetizar(nome,rng,dur):
    n=int(SR*dur);t=np.arange(n)/SR;x=np.zeros(n)
    if nome.startswith('chuva'):
        x=filtro(ruido(rng,n),[700,13000],'bandpass')*.22
        for at in rng.uniform(0,dur,int(dur*90)):
            e=pulso(rng,.025,rng.uniform(3000,12000),rng.uniform(120,350))
            adicionar(x,e,at,rng.uniform(.1,.7))
        x*=.8+.2*np.sin(t*.63)
    elif nome=='vento':
        mod=np.interp(t,np.arange(0,dur+1,.7),rng.uniform(.12,1,len(np.arange(0,dur+1,.7))))
        mod=filtro(mod,2)
        x=filtro(ruido(rng,n,'pink'),[80,1000],'bandpass')*mod
        x+=filtro(ruido(rng,n),[450,700],'bandpass')*mod**2*.13
    elif nome=='ondas':
        mod=(.5+.5*np.sin(t*2*np.pi/5-1.3))**2
        x=filtro(ruido(rng,n,'pink'),1600)*mod*.4
        foam=np.maximum(0,np.sin(t*2*np.pi/5-.7))**3
        x+=filtro(ruido(rng,n),[1600,8000],'bandpass')*foam*.15
    elif nome=='trovao':
        x=filtro(ruido(rng,n,'brown'),[35,550],'bandpass')*(1-np.exp(-t*80))*np.exp(-t*.85)
        for at,amp in [(0,.9),(.12,.45),(.31,.28),(.72,.2),(1.4,.12)]:
            adicionar(x,pulso(rng,.5,2200,10),at,amp)
        x+=filtro(ruido(rng,n,'pink'),700)*np.exp(-t*.6)*.18
    elif nome.startswith('passos'):
        for at in np.arange(.25,dur-.5,.58):
            at+=rng.uniform(-.045,.045);et=np.arange(int(.4*SR))/SR
            thud=np.sin(2*np.pi*85*et)*np.exp(-et*38)*.2
            if nome=='passos_areia':
                e=pulso(rng,.4,4200,14)*.7+thud
                for _ in range(16):adicionar(e,pulso(rng,.012,6000,300),rng.uniform(.015,.18),rng.uniform(.1,.4))
            elif nome=='passos_agua':
                e=pulso(rng,.4,6500,14)*.5+thud
                for _ in range(5):
                    bt=np.arange(int(.08*SR))/SR;freq=rng.uniform(350,1800)
                    bubble=np.sin(2*np.pi*(freq*bt+900*bt**2))*np.exp(-bt*55)
                    adicionar(e,bubble,rng.uniform(.03,.23),rng.uniform(.06,.18))
            else:
                e=pulso(rng,.4,1800,32)*.2+thud
                e+=sum(np.sin(2*np.pi*f*et)*np.exp(-et*d)*a for f,d,a in [(210,24,.1),(475,35,.05),(810,40,.03)])
            adicionar(x,e,at,rng.uniform(.7,1))
    elif nome=='fogo':
        x=filtro(ruido(rng,n,'brown'),800)*.06
        for at in rng.uniform(0,dur,int(dur*7)):
            adicionar(x,pulso(rng,.08,rng.uniform(1500,8000),100),at,rng.uniform(.2,1))
    else:raise ValueError(nome)
    return x

def salvar(path,x):
    x=x-np.mean(x);fade=min(int(.015*SR),len(x)//4)
    x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade)
    x=x/(np.max(np.abs(x))+1e-12)*10**(-6/20)
    write(path,SR,(x*32767).astype(np.int16))

def main():
    p=argparse.ArgumentParser();p.add_argument('--seed',type=int,default=20261012);p.add_argument('--saida',type=Path,default=Path(__file__).parent/'saida');a=p.parse_args()
    a.saida.mkdir(parents=True,exist_ok=True);rng=np.random.default_rng(a.seed);inicio=time.perf_counter();itens=[]
    for nome,dur in [('chuva',12),('trovao',6),('vento',12),('ondas',15),('passos_areia',8),('passos_agua',8),('passos_madeira',8),('fogo',12)]:
        x=sintetizar(nome,rng,dur);salvar(a.saida/(nome+'.wav'),x);itens.append({'arquivo':nome+'.wav','duracao':dur,'sample_rate':SR,'seed':a.seed,'origem':'síntese original, sem gravações'})
    dados={'tempo_geracao_segundos':round(time.perf_counter()-inicio,3),'arquivos':itens}
    (a.saida/'medidas.json').write_text(json.dumps(dados,ensure_ascii=False,indent=2));print(json.dumps(dados,ensure_ascii=False))
if __name__=='__main__':main()
