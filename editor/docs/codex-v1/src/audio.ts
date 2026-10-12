import { length, type Project } from './model';
export class AudioMixer {
 private context?:AudioContext;private buffers=new Map<string,AudioBuffer>();private active:{source:AudioBufferSourceNode;gain:GainNode}[]=[];
 async prepare(p:Project){this.context??=new AudioContext();await this.context.resume();await Promise.all([...new Set(p.clips.map(c=>c.source))].map(async s=>{if(!this.buffers.has(s)){const response=await fetch('/api/audio/'+s+'.m4a');if(!response.ok)throw Error('Não foi possível abrir '+s);this.buffers.set(s,await this.context!.decodeAudioData(await response.arrayBuffer()));}}));}
 start(p:Project,t:number){this.stop();const ctx=this.context!;const anchor=ctx.currentTime+.04;for(const c of p.clips){const end=c.start+length(c);if(end<=t)continue;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffers.get(c.source)!;gain.gain.value=c.volume;source.connect(gain).connect(ctx.destination);const elapsed=Math.max(0,t-c.start);source.start(anchor+Math.max(0,c.start-t),c.trimIn+elapsed,length(c)-elapsed);this.active.push({source,gain});}return anchor;}
 get time(){return this.context?.currentTime??0;}
 stop(){for(const s of this.active){try{s.source.stop();}catch{}s.source.disconnect();s.gain.disconnect();}this.active=[];}
}
