import { Renderer, type Light } from '../../engine/src/core/renderer';
import { gridToBitmap, normalMap, type Grid, type RGB } from '../../engine/src/core/pixels';
import { composeSkin, poseKey, REST } from '../../engine/src/skins/animate';
import { SKINS } from '../../engine/src/skins';
import { jesus } from '../../engine/src/skins/jesus';
import type { Skin } from '../../engine/src/skins/types';
import { SETS } from '../../engine/src/sets';
import { paint, type SetInstance } from '../../engine/src/sets/types';
import { Timeline } from '../../engine/src/scene/timeline';
import type { Scene, Build } from '../../engine/src/scene/types';
import { duration, length, cueTime, type Project } from './model';
const derivative=(id:string,name:string,robe:RGB,sash:RGB,hair:RGB):Skin=>({...structuredClone(jesus),id,name,palette:{...jesus.palette,W:robe,R:sash,H:hair},parts:jesus.parts.filter(p=>p.name!=='cajado'&&p.name!=='mão')});
export const skins:Record<string,Skin>={pedro:derivative('pedro','Pedro',[166,137,92],[91,107,111],[66,43,26]),andre:derivative('andre','André',[118,134,114],[166,143,98],[89,69,43]),...SKINS};
export const propNames:Record<string,string>={boat:'Barco',fire:'Fogueira',rock:'Pedra',palm:'Palmeira'};
const grids:Record<string,Grid>={
 boat:['................................','...............M................','...............M................','...............M................','...............M................','...............M................','...............M................','...............M................','.....TTTTTTTTTTMTTTTTTTTTTT.....','..TTTLLLLLLLLLLMLLLLLLLLLLLLTT..','...TBBBBBBBBBBBBBBBBBBBBBBBBT...','....TBBBBBBDDDDDDDDDDBBBBBBT....','.....TDDDDDDDDDDDDDDDDDDDDT.....','.......TTTTTTTTTTTTTTTTTT.......'],
 rock:['......AAAA......','....AABBBBAA....','..AABBBBBBBBAA..','.ABBBBBBBBBBBAA.','ABBBBBBBBCCCCCCA','ABBBBCCCCCCCCCCA','.ACCCCCCCCCCCCA.','..AAAAAAAAAAAA..'],
 fire:['........Y.......','.......YY.......','.......YWW......','......YWWW......','.....YWWWWY.....','.....YWWWWYY....','....YYWWWWYYY...','....YYWWWWWYY...','...YYWWWWWWYY...','...YYYWWWWYYY...','....YYYYYYYY....','..TTTDDDDDTTT...','.TTDDDTTDDDTT...'],
 palm:['.......GGGGGG........','....GGGggGGGGGGG.....','..GGggggGGggggggGG...','.GGggg..TT..gggggGG..','GGgg....TT.....gggGG.','Gg......TT.......ggG.','........TT........g..','........TT...........','........TD...........','........TD...........','........TD...........','........TD...........','........TD...........','.......TTD...........','.......TTD...........','.......TTD...........','.......TTD...........','......TTDDT..........']};
const palette:Record<string,RGB>={T:[135,95,56],L:[173,129,75],B:[115,74,40],D:[74,48,30],M:[126,95,62],A:[72,76,77],C:[88,94,96],G:[48,84,58],g:[71,111,65],Y:[223,133,48],W:[250,218,121]};
const thumbnails=new Map<string,string>();
function thumbnail(key:string,g:Grid,pal:Skin['palette']){if(thumbnails.has(key))return thumbnails.get(key)!;const b=gridToBitmap(g,pal);const c=document.createElement('canvas');c.width=b.w;c.height=b.h;c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(b.data),b.w,b.h),0,0);const uri=c.toDataURL();thumbnails.set(key,uri);return uri;}
export const skinSwatch=(id:string)=>thumbnail('skin:'+id,composeSkin(skins[id]??jesus,REST),(skins[id]??jesus).palette);
export function swatch(kind:string):string {
 return thumbnail(kind,grids[kind],palette);
}
export const rgb=(hex:string):RGB=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as RGB;
export class EngineAdapter {
 r:Renderer; private set?:SetInstance; private setKey=''; private lastProject?:Project; private timeline?:Timeline; private cache=new Map<string,{tex:WebGLTexture;normal:WebGLTexture;bmp:ReturnType<typeof gridToBitmap>}>();
 boxes:{id:string;x:number;y:number;w:number;h:number;type:'actor'|'object'|'point'}[]=[];
 constructor(public canvas:HTMLCanvasElement){this.r=new Renderer(canvas,{width:180,height:320,floorY:200});}
 private sprite(key:string,g:Grid,pal:Skin['palette'],normals?:Skin['normals']){let s=this.cache.get(key);if(!s){const bmp=gridToBitmap(g,pal);s={bmp,tex:this.r.texture(bmp),normal:this.r.texture(normalMap(g,normals))};this.cache.set(key,s);}return s;}
 render(p:Project,t:number){
 const r=this.r;
 if(this.setKey!==p.set){this.setKey=p.set;
  // Local sea adapter until the engine publishes its Galilee set.
  if(SETS[p.set]) this.set=SETS[p.set](r,p.set==='campfire'?{fireX:-100,fireZ:50}:{});
  else if(p.set==='campfire') this.set=SETS.campfire(r,{fireX:-100,fireZ:50});
  else {const sky=r.texture(paint(180,200,(x,y)=>{
   if((x*71+y*139)%937===0&&y<125)return [151,173,171];
   if(Math.hypot(x-137,y-44)<9)return [190,205,201];
   if(y>157+Math.sin(x*.06)*9)return [24,45,47];
   return y<65?[12,29,33]:y<135?[19,39,42]:[29,52,54];}));
   const sea=r.texture(paint(180,120,(x,y)=>((x+Math.floor(y/7)*13)%43<18&&y%7<2)?[81,118,118]:[39+(y%3)*4,77+(y%3)*3,79+(y%3)*3]));
   this.set={floorY:200,back:()=>{r.unlit(sky,{x:0,y:0,w:180,h:200},{parallax:0});r.floor(sea,{x:0,y:200,w:180,h:120});},props:()=>[],front:(t)=>{for(let i=0;i<22;i++){const x=(i*37+Math.floor(t*8))%180,y=207+(i*13)%110;r.unlit(r.white,{x,y,w:4+(i%3),h:1},{tint:[.34,.50,.49,1]});}},lights:()=>[]};}
  r.floorY=this.set!.floorY;Object.assign(r.look,this.set!.look??{}); r.look.ambient=[.25,.29,.28];r.look.bloom=.18;r.look.rays.strength=0;r.look.fogMax=0;
 }
 if(this.lastProject!==p){this.lastProject=p;
 const scene:Scene={id:'editor',audio:'audio/ep01',set:{kind:p.set},actors:Object.fromEntries(p.actors.map(a=>[a.id,{skin:a.skin,x:a.x,z:a.z}])),lines:p.clips.map(c=>({id:c.id,text:c.text,speaker:c.actor,caption:false})),cues:p.cues.map(c=>({...c,at:cueTime(p,c.at)}))};
 const build:Build={scene:'editor',fps:30,audio:'',duration:duration(p),lines:p.clips.map(c=>({id:c.id,speaker:c.actor,clipStart:c.start,clipDur:length(c),voiceStart:c.start,voiceEnd:c.start+length(c),mouth:Array.from({length:Math.ceil(length(c)*30)},(_,i)=>i%6<3?1:2)}))};
 this.timeline=new Timeline(scene,build);}
 const tl=this.timeline!;Object.assign(r.camera,tl.camera(t));
 const actors=p.actors.map(a=>{const s=skins[a.skin]??jesus,st=tl.actor(a.id,t),g=composeSkin(s,st.pose),spr=this.sprite(a.skin+poseKey(st.pose),g,s.palette,s.normals);return {a,st,spr,w:s.w*s.scale,h:s.h*s.scale};});
 const lights:Light[]=[{x:p.light.direction,y:-p.light.height,z:1,radius:0,color:rgb(p.light.color),intensity:p.light.intensity,directional:true},...p.points.map(l=>({x:l.x,y:-14,z:l.z,radius:140,color:rgb(l.color),intensity:l.intensity})),...p.objects.filter(o=>o.kind==='fire').slice(0,7-p.points.length).map(o=>({x:o.x,y:-14,z:o.z,radius:125,color:[1,.56,.23] as RGB,intensity:1.2+Math.sin(t*13)*.12}))];
 r.begin(lights,actors.map(a=>({bitmap:a.spr.bmp,x:a.st.x,z:a.st.z,w:a.w,h:a.h,flipX:a.st.facing<0})));this.set!.back(t);
 this.boxes=[]; const box=(id:string,type:'actor'|'object'|'point',x:number,z:number,w:number,h:number)=>{const q=r.toScreen(x-w/2,r.floorY+z*r.depthScale-h);this.boxes.push({id,type,x:q.x,y:q.y,w:w*r.camera.zoom,h:h*r.camera.zoom});};
 const items=actors.map(a=>({order:a.st.z,draw:()=>{r.billboard(a.spr.tex,a.st.x,a.st.z,a.w,a.h,{normal:a.spr.normal,flipX:a.st.facing<0});box(a.a.id,'actor',a.st.x,a.st.z,a.w,a.h);}}));
 for(const o of p.objects){const g=grids[o.kind],s=this.sprite('prop:'+o.kind,g,o.kind==='rock'?{...palette,B:[121,126,127]}:palette);const w=g[0].length*o.scale,h=g.length*o.scale;items.push({order:o.z+o.layer*1000,draw:()=>{r.billboard(s.tex,o.x,o.z,w,h,{normal:s.normal,emissive:o.kind==='fire'?.8:0});box(o.id,'object',o.x,o.z,w,h);}});}
 items.sort((a,b)=>a.order-b.order).forEach(i=>i.draw());this.set!.front(t);r.end();
 for(const l of p.points) box(l.id,'point',l.x,l.z,8,14);
 }
 hit(x:number,y:number){return [...this.boxes].reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);}
 dispose(){const gl=this.r.gl;for(const s of this.cache.values()){gl.deleteTexture(s.tex);gl.deleteTexture(s.normal);}gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
