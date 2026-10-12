import { EngineAdapter } from './engine-adapter';
import { duration, type Project } from './model';
export async function api(path:string,data?:unknown){const r=await fetch(path,data===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw Error(result.error??'Erro no servidor');return result;}
export async function exportMP4(p:Project,progress:(s:string)=>void){
 const {id}=await api('/api/export',p);const canvas=document.createElement('canvas');const engine=new EngineAdapter(canvas);
 try {const total=Math.ceil(duration(p)*30);for(let i=0;i<total;){const frames:string[]=[];for(let n=0;n<30&&i<total;n++,i++){engine.render(p,i/30);frames.push(canvas.toDataURL('image/png'));}await api(`/api/export/${id}/frames`,{frames});progress(`Renderizando ${Math.round(i/total*100)}%`);await new Promise(r=>setTimeout(r,0));}
 await api(`/api/export/${id}/finish`,{});progress('Codificando MP4…');for(;;){await new Promise(r=>setTimeout(r,600));const state=await api(`/api/export/${id}`);if(state.state==='error')throw Error(state.error);if(state.state==='done')break;}
 const response=await fetch(`/api/export/${id}/download`);if(!response.ok)throw Error('Não foi possível baixar o vídeo.');const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download='ep01.mp4';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);progress('MP4 pronto · cópia em editor/out');
 }finally{engine.dispose();await fetch(`/api/export/${id}`,{method:'DELETE'}).catch(()=>{});}
}
