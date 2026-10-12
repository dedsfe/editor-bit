import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseProject, length, duration, cueTime } from '../src/model.ts';
const root=resolve(import.meta.dirname,'../..');
const p=parseProject(JSON.parse(await readFile(resolve(root,'projetos/ep01.json'),'utf8')));
assert.equal(p.clips.length,12);assert.equal(new Set(p.clips.map(c=>c.source)).size,12);assert.equal(p.actors.length,3);
for(const c of p.clips){const dur=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',resolve(root,'audio/ep01',c.source+'.m4a')],{encoding:'utf8'}));assert.ok(Math.abs(c.sourceDuration-dur)<.002);}
assert.throws(()=>parseProject({...p,version:2}));assert.throws(()=>parseProject({...p,clips:[{...p.clips[0],trimOut:999}]}));assert.throws(()=>parseProject({...p,clips:[{...p.clips[0],source:'../../secret'}]}));
const c=p.clips[7],cut=length(c)/2,split={...p,clips:p.clips.flatMap(l=>l.id===c.id?[{...l,trimOut:l.trimIn+cut},{...l,id:'split',start:l.start+cut,trimIn:l.trimIn+cut}]:[l])};
assert.ok(Math.abs(cueTime(split,{line:c.source,at:'end'})-cueTime(p,{line:c.source,at:'end'}))<1e-8);assert.equal(duration(split),duration(p));
const server=spawn(process.execPath,[resolve(root,'editor/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5186'],{cwd:resolve(root,'editor'),stdio:'pipe'});let log='';server.stderr.on('data',s=>log+=s);server.stdout.on('data',s=>log+=s);
const base='http://127.0.0.1:5186';const request=async(path,data)=>{const r=await fetch(base+path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();assert.ok(r.ok,JSON.stringify(result));return result;};
try{
 let ready=false;for(let i=0;i<100;i++){try{await request('/api/project');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready,log);
 const invalid=await fetch(base+'/api/project',{method:'POST',body:JSON.stringify({version:2})});assert.equal(invalid.status,400);
 const copy={...p,name:'Teste automatizado'};const saved=await request('/api/project',copy);assert.deepEqual(JSON.parse(await readFile(resolve(root,saved.saved),'utf8')),copy);
 const audio=await fetch(base+'/api/audio/01-andre.m4a');assert.equal(audio.status,200);assert.ok((await audio.arrayBuffer()).byteLength>1000);
 // Six fixture frames verify the local FFmpeg muxer, not the WebGL renderer.
 const short={...p,name:'Fixture',duration:.2,clips:[{...p.clips[0],start:0,trimIn:0,trimOut:.2,volume:.5}],cues:[]};
 const {id}=await request('/api/export',short);const png=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x234338:s=180x320','-frames:v','1','-f','image2pipe','-vcodec','png','-']);
 await request(`/api/export/${id}/frames`,{frames:Array(6).fill('data:image/png;base64,'+png.toString('base64'))});await request(`/api/export/${id}/finish`,{});
 let state;for(let i=0;i<100;i++){state=await request(`/api/export/${id}`);if(state.state==='done'||state.state==='error')break;await new Promise(r=>setTimeout(r,200));}assert.equal(state.state,'done',state.error);
 const movie=resolve(root,'editor/out',id+'.mp4'),probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',movie],{encoding:'utf8'}));assert.ok(probe.streams.some(s=>s.codec_name==='h264'&&s.width===1080&&s.height===1920));assert.ok(probe.streams.some(s=>s.codec_name==='aac'));assert.ok(Math.abs(Number(probe.format.duration)-.2)<.05);
 await writeFile(resolve(root,'editor/out/api-test.json'),JSON.stringify({passed:true,checks:['12 áudios e durações','JSON inválido','corte preserva referência de ação','salvar e abrir no disco','áudio servido','fixture MP4 H.264 + AAC, 1080x1920'],fixture:probe.format.duration},null,2));await rm(movie);await fetch(`${base}/api/export/${id}`,{method:'DELETE'});
 console.log('OK: projeto, 12 áudios, validação, referências de ações, API de persistência e muxer MP4.');
}finally{server.kill();await rm(resolve(root,'projetos/teste-automatizado.json'),{force:true});}
