import { chromium } from '../../engine/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'editor/out');await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[resolve(root,'editor/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5187'],{cwd:resolve(root,'editor'),stdio:'pipe'});let serverLog='';server.stdout.on('data',s=>serverLog+=s);server.stderr.on('data',s=>serverLog+=s);
let browser;const errors=[];
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:5187/api/project')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,serverLog);
 const chrome=process.env.CHROME_PATH??(!process.env.PLAYWRIGHT_BROWSERS_PATH&&existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
 browser=await chromium.launch({headless:true,executablePath:chrome,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:5187');await page.getByRole('status').filter({hasText:'carregado'}).waitFor();await page.waitForTimeout(400);
 const snapshot=async()=>{const d=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar JSON',exact:true}).click();return JSON.parse(await readFile(await (await d).path(),'utf8'));};
 const range=async(label,value)=>{await page.getByRole('slider',{name:label,exact:true}).fill(String(value));};
 await page.screenshot({path:resolve(out,'01-editor.png')});assert.equal((await snapshot()).clips.length,12);
 const frame=()=>page.locator('canvas[aria-label]').evaluate(c=>c.toDataURL());const before=await frame();
 await page.getByRole('button',{name:'Reproduzir',exact:true}).click();await page.getByRole('button',{name:'Pausar',exact:true}).waitFor();await page.waitForTimeout(500);await page.getByRole('button',{name:'Pausar',exact:true}).click();assert.ok(Number(await page.getByRole('slider',{name:'Posição de reprodução'}).inputValue())>0);
 await range('Posição de reprodução',0);
 const bounds=await page.locator('canvas[aria-label]').boundingBox();const original=await snapshot();const pedro=original.actors.find(a=>a.id==='pedro');
 await page.mouse.move(bounds.x+pedro.x/180*bounds.width,bounds.y+(200+pedro.z*.5-25)/320*bounds.height);await page.mouse.down();await page.mouse.move(bounds.x+(pedro.x+10)/180*bounds.width,bounds.y+(200+pedro.z*.5-25)/320*bounds.height,{steps:8});await page.mouse.up();assert.ok((await snapshot()).actors.find(a=>a.id==='pedro').x>pedro.x+8);
 await page.locator('.skin-list').getByRole('button',{name:/^André/}).click();assert.equal((await snapshot()).actors.find(a=>a.id==='pedro').skin,'andre');
 for(const name of ['Barco','Fogueira','Pedra','Palmeira']){await page.locator('.props').getByRole('button',{name:new RegExp(name)}).click();}assert.equal((await snapshot()).objects.length,5);await range('Escala',3);await page.getByRole('combobox',{name:'Camada'}).selectOption('-1');await page.getByRole('button',{name:'Apagar objeto',exact:true}).click();assert.equal((await snapshot()).objects.length,4);
 await page.getByRole('button',{name:'Iluminação',exact:false}).click();await range('Esquerda ↔ direita',1.5);await range('Altura da luz',2);await range('Intensidade',2.5);await page.getByLabel('Cor principal',{exact:true}).fill('#ffe3ba');await page.getByRole('button',{name:'Adicionar luz pontual',exact:false}).click();await range('Posição X',120);await range('Intensidade pontual',2);assert.equal((await snapshot()).points[0].x,120);await page.waitForTimeout(150);assert.notEqual(await frame(),before);await page.screenshot({path:resolve(out,'02-luz.png')});await page.getByRole('button',{name:'Apagar luz',exact:true}).click();assert.equal((await snapshot()).points.length,0);
 const audio=page.getByRole('button',{name:'Fala 01-andre',exact:true});let b=await audio.boundingBox();const originalStart=(await snapshot()).clips[0].start;await page.mouse.move(b.x+b.width/2,b.y+12);await page.mouse.down();await page.mouse.move(b.x+b.width/2+28,b.y+12,{steps:5});await page.mouse.up();assert.ok((await snapshot()).clips[0].start>originalStart+1.8);
 const edge=page.getByRole('button',{name:'Aparar começo 01-andre',exact:true});b=await edge.boundingBox();await page.mouse.move(b.x+4,b.y+10);await page.mouse.down();await page.mouse.move(b.x+18,b.y+10,{steps:4});await page.mouse.up();assert.ok((await snapshot()).clips[0].trimIn>.8);
 const right=page.getByRole('button',{name:'Aparar fim 01-andre',exact:true});b=await right.boundingBox();await page.mouse.move(b.x+4,b.y+10);await page.mouse.down();await page.mouse.move(b.x-10,b.y+10,{steps:4});await page.mouse.up();let edited=(await snapshot()).clips[0];assert.ok(edited.trimOut<edited.sourceDuration-.8);
 await range('Volume',.4);await range('Posição de reprodução',edited.start+1);await page.getByRole('button',{name:'Dividir no cursor',exact:true}).click();assert.equal((await snapshot()).clips.length,13);await page.screenshot({path:resolve(out,'03-timeline.png')});
 await page.locator('.track-labels').getByRole('button',{name:'Cenário',exact:false}).click();await page.getByRole('button',{name:'Deserto à noite',exact:false}).click();assert.equal((await snapshot()).set,'campfire');await page.getByRole('button',{name:'Mar da Galileia',exact:false}).click();
 await page.getByRole('textbox',{name:'Nome do projeto'}).fill('Teste UI');await page.getByRole('button',{name:'Salvar',exact:true}).click();await page.getByRole('status').filter({hasText:'Salvo em projetos/teste-ui.json'}).waitFor();const saved=await snapshot();assert.deepEqual(JSON.parse(await readFile(resolve(root,'projetos/teste-ui.json'),'utf8')),saved);
 await page.locator('input[type=file]').setInputFiles(resolve(root,'projetos/ep01.json'));await page.getByRole('status').filter({hasText:'Projeto aberto'}).waitFor();assert.equal((await snapshot()).clips.length,12);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:resolve(out,'04-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000});
 if(process.env.EXPORT_FULL==='1'){const d=page.waitForEvent('download',{timeout:300000});await page.getByRole('button',{name:'Exportar MP4',exact:true}).click();await (await d).saveAs(resolve(out,'ep01.mp4'));}
 assert.deepEqual(errors,[]);await writeFile(resolve(out,'ui-test.json'),JSON.stringify({passed:true,screenshots:4,fullExport:process.env.EXPORT_FULL==='1'},null,2));console.log('OK: controles, drag, trims, split, volume, skins, luzes, cenários, JSON e screenshots.');
}catch(e){await writeFile(resolve(out,'ui-test.json'),JSON.stringify({passed:false,error:String(e),pageErrors:errors},null,2));throw e;}
finally{await browser?.close();server.kill();await rm(resolve(root,'projetos/teste-ui.json'),{force:true});}
