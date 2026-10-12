import type { Cue, TimeRef } from '../../engine/src/scene/types';
export type Actor = {id:string; name:string; skin:string; x:number; z:number};
export type Clip = {id:string;source:string;actor:string;start:number;trimIn:number;trimOut:number;sourceDuration:number;volume:number;text:string};
export type Prop = {id:string;kind:string;x:number;z:number;scale:number;layer:number};
export type Point = {id:string;x:number;z:number;color:string;intensity:number};
export type Project = {version:1;name:string;duration:number;set:string;actors:Actor[];clips:Clip[];objects:Prop[];light:{direction:number;height:number;color:string;intensity:number};points:Point[];cues:Cue[]};
export const length=(c:Clip)=>c.trimOut-c.trimIn;
export const duration=(p:Project)=>Math.max(p.duration,...p.clips.map(c=>c.start+length(c)));
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export function parseProject(value:unknown):Project {
 const p=value as Project;
 if(!p||p.version!==1||typeof p.name!=='string'||!Number.isFinite(p.duration)||p.duration<=0||p.duration>600||!['galilee','campfire'].includes(p.set)||!Array.isArray(p.actors)||!Array.isArray(p.clips)||!Array.isArray(p.objects)||!Array.isArray(p.points)||!Array.isArray(p.cues)||!p.light) throw Error('Projeto v1 inválido.');
 const finite=(...ns:number[])=>ns.every(Number.isFinite);
 if(p.actors.length!==3||p.actors.some(a=>!['jesus','pedro','andre'].includes(a.id)||typeof a.skin!=='string'||!finite(a.x,a.z))) throw Error('Personagens inválidos.');
 if(p.clips.some(c=>!/^\d{2}-(andre|pedro|jesus)$/.test(c.source)||!p.actors.some(a=>a.id===c.actor)||!finite(c.start,c.trimIn,c.trimOut,c.sourceDuration,c.volume)||c.start<0||c.trimIn<0||c.trimOut>c.sourceDuration||length(c)<.05||c.volume<0||c.volume>2)) throw Error('Áudio ou corte inválido.');
 if(p.objects.some(o=>!['boat','fire','rock','palm'].includes(o.kind)||!finite(o.x,o.z,o.scale,o.layer)||o.scale<.25||o.scale>4)||p.points.length>7||p.points.some(o=>!finite(o.x,o.z,o.intensity)||!/^#[\da-f]{6}$/i.test(o.color))) throw Error('Objetos ou luzes inválidos.');
 if(!finite(p.light.direction,p.light.height,p.light.intensity)||!/^#[\da-f]{6}$/i.test(p.light.color)) throw Error('Luz inválida.');
 if(duration(p)>600) throw Error('O projeto v1 suporta até 10 minutos.');
 const ids=[...p.actors,...p.clips,...p.objects,...p.points].map(o=>o.id); if(new Set(ids).size!==ids.length) throw Error('IDs duplicados.');
 if(p.cues.some(c=>{const ref=c.at;return !['walk','face','camera','shake'].includes(c.type)||(typeof ref!=='object'&&!Number.isFinite(ref))||(typeof ref==='object'&&(!ref||!p.clips.some(l=>l.source===ref.line)));})) throw Error('Ação inválida.');
 return p;
}

export function cueTime(p:Project,ref:TimeRef){if(typeof ref==='number')return ref;const clips=p.clips.filter(c=>c.source===ref.line);return (clips.length?(ref.at==='end'?Math.max(...clips.map(c=>c.start+length(c))):Math.min(...clips.map(c=>c.start))):0)+(ref.offset??0);}
