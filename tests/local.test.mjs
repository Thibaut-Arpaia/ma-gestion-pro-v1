import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {empty,change,validate} from '../model.mjs';
const setup={day:'2026-09-01',balance:'1 000,00',next:'100'};
const expense={day:'2026-09-15',amount:'42,50',vat:'7,08',label:'Test',category:'Restaurant',payment:'Carte pro',notes:''};
const revenue={day:'2026-09-20',amount:'12000,00',vat:'2000,00',label:'Commission test',category:'Commission immobilière',notes:''};
test('Dépenses : montants, historique, références et annulation',()=>{
 let d=change(empty(),'setup',setup);d=change(d,'save',expense);assert.equal(d.expenses[0].cents,4250);assert.equal(d.expenses[0].ref,100);assert.equal(d.next,101);
 d=change(d,'save',{...expense,day:'2026-08-30',ref:'99'});assert.equal(d.expenses[1].historical,true);assert.equal(d.next,101);
 d=change(d,'remove',1);assert.equal(d.expenses[0].cancelled,true);assert.equal(d.next,100);d=change(d,'save',expense);assert.equal(d.expenses[2].ref,100);
 assert.throws(()=>change(d,'save',{...expense,day:'2026-08-30',ref:'99'}));
 assert.throws(()=>change(d,'save',{...expense,day:'2026-02-30'}));
 assert.throws(()=>change(d,'save',{...expense,amount:'1.001'}));
 assert.throws(()=>change(d,'save',{...expense,vat:'100'}));
 assert.throws(()=>change(d,'save',{...expense,id:2,day:'2026-09-01'}));
 assert.throws(()=>validate({...d,next:99}));
 assert.throws(()=>validate({...d,expenses:[...d.expenses,d.expenses[0]]}));
});
test('Écriture disque, réouverture, sauvegarde, restauration et erreur sans faux succès',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'mgp-test-'));let fail=false,selection=null,queue=Promise.resolve();
 function fileHandle(file){return {getFile:async()=>{let buffer;try{buffer=await fs.readFile(file);}catch(e){if(e.code==='ENOENT')e.name='NotFoundError';throw e;}return {size:buffer.length,text:async()=>buffer.toString()};},createWritable:async()=>{let content;return {write:async v=>{if(fail)throw Error('Disque indisponible');content=v;},close:async()=>{await fs.writeFile(file+'.tmp',content);await fs.rename(file+'.tmp',file);},abort:async()=>{}};}};}
 function dirHandle(dir){return {name:path.basename(dir),getFileHandle:async(name,options={})=>{const p=path.join(dir,name);if(!options.create){try{await fs.access(p);}catch(e){e.name='NotFoundError';throw e;}}return fileHandle(p);},getDirectoryHandle:async(name)=>{const p=path.join(dir,name);await fs.mkdir(p,{recursive:true});return dirHandle(p);}};}
 globalThis.window={isSecureContext:true,showDirectoryPicker:async()=>dirHandle(root),showOpenFilePicker:async()=>[fileHandle(selection)],confirm:()=>true};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(_name,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}}}});
 try{
 const a=await import('../storage.mjs?test1');await a.run('connect');await a.run('setup',setup);await a.run('save',expense);
 const b=await import('../storage.mjs?test2');assert.equal((await b.run('state')).connected,false);const reopened=await b.run('connect');assert.equal(reopened.expenses[0].cents,4250);
 const saved=await b.run('backup');selection=path.join(root,'sauvegardes',saved.file);
 await Promise.all([b.run('save',expense),b.run('save',expense)]);assert.equal((await b.run('state')).next,103);
 await b.run('restore');assert.equal((await b.run('state')).expenses.length,1);
 const prior=await fs.readFile(path.join(root,'ma-gestion-pro.json'),'utf8');fail=true;await assert.rejects(b.run('save',expense),/Disque indisponible/);fail=false;
 assert.equal(await fs.readFile(path.join(root,'ma-gestion-pro.json'),'utf8'),prior);
 selection=path.join(root,'invalid.json');await fs.writeFile(selection,'{}');await assert.rejects(b.run('restore'));assert.equal(await fs.readFile(path.join(root,'ma-gestion-pro.json'),'utf8'),prior);
 await b.run('remove',1);assert.equal((await b.run('state')).expenses.length,0);assert.equal((await b.run('state')).next,100);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('Recettes : création, modification, suppression et validation',()=>{
 let d=change(empty(),'setup',setup);d=change(d,'saveRevenue',revenue);assert.equal(d.revenues[0].cents,1200000);assert.equal(d.revenues[0].vat_cents,200000);assert.equal(d.revenues[0].cancelled,false);
 d=change(d,'saveRevenue',{...revenue,id:1,amount:'13000,00',vat:'2166,67'});assert.equal(d.revenues[0].cents,1300000);assert.equal(d.revenues[0].vat_cents,216667);
 d=change(d,'removeRevenue',1);assert.equal(d.revenues[0].cancelled,true);
 assert.throws(()=>change(d,'saveRevenue',{...revenue,amount:'0'}));
 assert.throws(()=>change(d,'saveRevenue',{...revenue,label:''}));
 assert.throws(()=>change(d,'saveRevenue',{...revenue,vat:'14000'}));
});
