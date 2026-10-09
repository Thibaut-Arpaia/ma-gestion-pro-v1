import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {empty,change,validate,calcCommission,commissionSummary,reverseCommissionBase,financeSummary,dashboardSummary} from '../model.mjs';
const near=(actual,expected,delta=1)=>assert.ok(Math.abs(actual-expected)<=delta,`${actual} attendu proche de ${expected}`);
const setup={day:'2026-09-01',balance:'1 000,00',next:'100'};
const expense={day:'2026-09-15',amount:'42,50',vat:'7,08',label:'Test',category:'Restaurant',payment:'Carte pro',notes:''};
const revenue={day:'2026-09-20',amount:'12000,00',vat:'2000,00',label:'Commission test',category:'Commission immobilière',notes:''};
const withoutPath=r=>{const {path:_,...rest}=r;return rest;};
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
test('Préférences : fond d’écran personnalisé validé et réinitialisable',()=>{
 let d=change(empty(),'setup',setup);
 d=change(d,'saveBackground',{name:'terrasse.webp',type:'image/webp',size:1000,data:'QUJD'});
 assert.equal(d.preferences.background.name,'terrasse.webp');
 assert.equal(d.expenses.length,0);
 d=change(d,'saveBackground',{name:'sunset-motel.png',type:'image/png',size:2623000,data:'A'.repeat(3500000)});
 assert.equal(d.preferences.background.name,'sunset-motel.png');
 d=change(d,'resetBackground');
 assert.equal(d.preferences.background,null);
 assert.throws(()=>change(d,'saveBackground',{name:'fond.gif',type:'image/gif',size:1000,data:'QUJD'}),/Format de fond/);
 assert.throws(()=>change(d,'saveBackground',{name:'fond.png',type:'image/png',size:3000001,data:'QUJD'}),/3 Mo/);
 assert.equal(validate({...d,preferences:undefined}).preferences.background,null);
});
test('Écriture disque, réouverture, sauvegarde, restauration et erreur sans faux succès',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'mgp-test-'));let fail=false,selection=null,queue=Promise.resolve();
 function fileHandle(file){return {getFile:async()=>{let buffer;try{buffer=await fs.readFile(file);}catch(e){if(e.code==='ENOENT')e.name='NotFoundError';throw e;}return {size:buffer.length,text:async()=>buffer.toString(),arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)};},createWritable:async()=>{let content;return {write:async v=>{if(fail)throw Error('Disque indisponible');content=v instanceof Blob?Buffer.from(await v.arrayBuffer()):v;},close:async()=>{await fs.writeFile(file+'.tmp',content);await fs.rename(file+'.tmp',file);},abort:async()=>{}};}};}
 function dirHandle(dir){return {name:path.basename(dir),getFileHandle:async(name,options={})=>{const p=path.join(dir,name);if(!options.create){try{await fs.access(p);}catch(e){e.name='NotFoundError';throw e;}}return fileHandle(p);},getDirectoryHandle:async(name)=>{const p=path.join(dir,name);await fs.mkdir(p,{recursive:true});return dirHandle(p);}};}
 globalThis.window={isSecureContext:true,showDirectoryPicker:async()=>dirHandle(root),showOpenFilePicker:async()=>[fileHandle(selection)],confirm:()=>true};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(_name,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}}}});
 try{
 const receipt={name:'ticket.pdf',type:'application/pdf',size:9,data:Buffer.from('%PDF-1.4\n').toString('base64')};
 const background={name:'fond-test.webp',type:'image/webp',size:1200,data:Buffer.from('fond-test').toString('base64')};
 const a=await import('../storage.mjs?test1');await a.run('connect');await a.run('setup',setup);await a.run('save',{...expense,receipt});await a.run('saveRecurring',{label:'Abonnement disque',category:'Abonnements',amount:'24',vat:'4',payment:'Prélèvement',day:15,start:'2026-12'});await a.run('saveBackground',background);
 const b=await import('../storage.mjs?test2');assert.equal((await b.run('state')).connected,false);const reopened=await b.run('connect');assert.equal(reopened.expenses[0].cents,4250);assert.deepEqual(withoutPath(reopened.expenses[0].receipt),receipt);assert.match(reopened.expenses[0].receipt.path,/^justificatifs\/DEP-000100-test-/);assert.equal(reopened.recurring[0].label,'Abonnement disque');
 assert.equal(reopened.preferences.background.name,background.name);assert.equal(reopened.preferences.background.data,background.data);assert.match(reopened.preferences.background.path,/^fonds\/fond-/);
 const savedJson=JSON.parse(await fs.readFile(path.join(root,'ma-gestion-pro.json'),'utf8'));assert.equal(savedJson.preferences.background.data,undefined);assert.match(savedJson.preferences.background.path,/^fonds\/fond-/);assert.equal(savedJson.expenses[0].receipt.data,undefined);assert.match(savedJson.expenses[0].receipt.path,/^justificatifs\/DEP-000100-test-/);
 const saved=await b.run('backup');selection=path.join(root,'sauvegardes',saved.file);
 await Promise.all([b.run('save',expense),b.run('save',expense)]);assert.equal((await b.run('state')).next,103);
 await b.run('restore');assert.equal((await b.run('state')).recurring[0].label,'Abonnement disque');assert.equal((await b.run('state')).expenses.length,1);assert.deepEqual(withoutPath((await b.run('state')).expenses[0].receipt),receipt);assert.equal((await b.run('state')).preferences.background.data,background.data);
 const exported=await b.run('exportData'),exportData=JSON.parse(exported.json);assert.match(exported.name,/^ma-gestion-pro-export-\d{4}-\d{2}-\d{2}\.json$/);assert.equal(exportData.expenses.length,1);assert.equal(exportData.preferences.background.data,background.data);assert.deepEqual(withoutPath(exportData.expenses[0].receipt),receipt);
 await b.run('resetBackground');assert.equal((await b.run('state')).preferences.background,null);
 const prior=await fs.readFile(path.join(root,'ma-gestion-pro.json'),'utf8');fail=true;await assert.rejects(b.run('save',expense),/Disque indisponible/);fail=false;
 assert.equal(await fs.readFile(path.join(root,'ma-gestion-pro.json'),'utf8'),prior);
 selection=path.join(root,'invalid.json');await fs.writeFile(selection,'{}');await assert.rejects(b.run('restore'));assert.equal(await fs.readFile(path.join(root,'ma-gestion-pro.json'),'utf8'),prior);
 await b.run('remove',1);assert.equal((await b.run('state')).expenses.length,0);assert.equal((await b.run('state')).next,100);const deletedExport=JSON.parse((await b.run('exportData')).json);assert.equal(deletedExport.expenses.length,1);assert.equal(deletedExport.expenses[0].cancelled,true);
 await b.run('save',{...expense,receipt});await b.run('clearBank',{kind:'expense',id:2,day:'2026-09-15'});await b.run('closeBank',{end:'2026-09-30',balance:'957.50'});
 const c=await import('../storage.mjs?test3');await c.run('connect');assert.equal((await c.run('state')).bankClosures.length,1);assert.equal((await c.run('state')).expenses[0].clearedDay,'2026-09-15');
 const closedBackup=await c.run('backup');selection=path.join(root,'sauvegardes',closedBackup.file);await c.run('reopenBank',{});assert.equal((await c.run('state')).bankClosures.length,0);await c.run('restore');assert.equal((await c.run('state')).bankClosures.length,1);assert.deepEqual(withoutPath((await c.run('state')).expenses[0].receipt),receipt);
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
test('Calculatrice commission : agence TTC en simulation, recettes conseiller TTC en historique',()=>{
 let r=calcCommission({agencyTtc:'20000',share:'100',previousHt:'0'});
 assert.equal(r.agencyHt,1666667);
 assert.equal(r.personalBaseHt,1666667);
 assert.equal(r.advisorHt,1166667);
 assert.equal(r.advisorVat,233333);
 assert.equal(r.advisorTtc,1400000);
 assert.equal(r.urssaf,298667);
 assert.equal(r.net,868000);
 r=calcCommission({agencyTtc:'20000',share:'50',previousHt:'0'});
 assert.equal(r.personalBaseHt,833334);
 assert.equal(r.advisorTtc,700001);
 r=calcCommission({agencyTtc:'20000',share:'100',previousHt:'95000'});
 assert.equal(r.advisorTtc,1800000);
 assert.equal(r.nextHt,11166667);
 const crossed=reverseCommissionBase(1495000,3800000);
 assert.equal(crossed.baseHt,2000000);
 assert.equal(crossed.nextHt,5800000);
 r=calcCommission({agencyTtc:'24000',share:'100',previousHt:'38000'});
 assert.equal(r.personalBaseHt,2000000);
 assert.equal(r.advisorHt,1495000);
 assert.equal(r.nextHt,5800000);
 let d=change(empty(),'setup',setup);
 d=change(d,'saveRevenue',{...revenue,day:'2026-01-10',amount:'14000',vat:'2333.33'});
 d=change(d,'saveRevenue',{...revenue,day:'2025-01-10',amount:'99999',vat:'0'});
 d=change(d,'saveRevenue',{...revenue,day:'2026-01-11',category:'Autre recette',amount:'99999',vat:'0'});
 const s=commissionSummary(d.revenues,2026);
 assert.equal(s.count,1);
 assert.equal(s.baseHt,1666667);
 assert.equal(s.advisorTtc,1400000);
 assert.throws(()=>calcCommission({agencyTtc:'0',share:'100',previousHt:'0'}));
 assert.throws(()=>calcCommission({agencyTtc:'10000',share:'0',previousHt:'0'}));
 assert.throws(()=>calcCommission({agencyTtc:'10000',share:'100',previousHt:'-1'}));
});
test('Calculatrice commission : cas Excel connus et franchissements de paliers',()=>{
 const cases=[
  {agencyTtc:'14000.00',share:'100',previousHt:'0',advisorHt:816667,nextHt:1166667},
  {agencyTtc:'16200.00',share:'50',previousHt:'11666.67',advisorHt:472500,nextHt:1841667},
  {agencyTtc:'8000.00',share:'100',previousHt:'18416.67',advisorHt:466667,nextHt:2508334},
  {agencyTtc:'14000.00',share:'100',previousHt:'25083.34',advisorHt:816667,nextHt:3675001},
  {agencyTtc:'6000.00',share:'50',previousHt:'36750.01',advisorHt:176250,nextHt:3925001},
  {agencyTtc:'20000.00',share:'50',previousHt:'39250.01',advisorHt:625000,nextHt:4758335},
  {agencyTtc:'10000.00',share:'100',previousHt:'47583.35',advisorHt:625000,nextHt:5591668}
 ];
 for(const c of cases){const r=calcCommission(c);near(r.advisorHt,c.advisorHt);assert.equal(r.nextHt,c.nextHt);}
 let r=calcCommission({agencyTtc:'1200',share:'100',previousHt:'38000'});
 assert.equal(r.personalBaseHt,100000);
 assert.equal(r.advisorHt,70000);
 assert.equal(r.nextHt,3900000);
 r=calcCommission({agencyTtc:'24000',share:'100',previousHt:'38000'});
 assert.equal(r.personalBaseHt,2000000);
 assert.equal(r.advisorHt,1495000);
 assert.equal(r.nextHt,5800000);
 r=calcCommission({agencyTtc:'19200',share:'100',previousHt:'59000'});
 assert.equal(r.personalBaseHt,1600000);
 assert.equal(r.advisorHt,1280000);
 assert.equal(r.nextHt,7500000);
 r=calcCommission({agencyTtc:'18000',share:'100',previousHt:'75000'});
 assert.equal(r.personalBaseHt,1500000);
 assert.equal(r.advisorHt,1275000);
 assert.equal(r.nextHt,9000000);
 r=calcCommission({agencyTtc:'12000',share:'100',previousHt:'90000'});
 assert.equal(r.personalBaseHt,1000000);
 assert.equal(r.advisorHt,900000);
 assert.equal(r.nextHt,10000000);
});
test('Dashboard : TVA nette, réserve URSSAF et argent réellement libre',()=>{
 let d=change(empty(),'setup',setup);
 d=change(d,'saveRevenue',{...revenue,day:'2026-09-20',amount:'14000',vat:'0'});
 d=change(d,'save',{...expense,day:'2026-09-21',amount:'120',vat:'20',category:'Restaurant'});
 let f=financeSummary(d,2026);
 assert.equal(f.revenueHt,1166667);
 assert.equal(f.vatCollected,233333);
 assert.equal(f.vatDeductible,2000);
 assert.equal(f.vatNet,231333);
 assert.equal(f.urssafGenerated,300417);
 assert.equal(f.urssafReserve,300417);
 assert.equal(f.reserved,531750);
 d=change(d,'save',{...expense,day:'2026-09-22',amount:'1000',vat:'0',category:'TVA reversée'});
 d=change(d,'save',{...expense,day:'2026-09-23',amount:'500',vat:'0',category:'Cotisations URSSAF'});
 f=financeSummary(d,2026);
 assert.equal(f.vatPaid,100000);
 assert.equal(f.urssafPaid,50000);
 assert.equal(f.vatNet,131333);
 assert.equal(f.urssafReserve,250417);
 assert.equal(f.reserved,381750);
});
test('Dashboard : paiements TVA/URSSAF reconnus malgré variantes de saisie',()=>{
 let d=change(empty(),'setup',setup);
 d=change(d,'saveRevenue',{...revenue,day:'2026-09-20',amount:'14000',vat:'0'});
 d=change(d,'save',{...expense,day:'2026-09-21',amount:'120',vat:'20',category:'Restaurant'});
 d=change(d,'save',{...expense,day:'2026-09-22',amount:'1000',vat:'0',category:'tva reverse'});
 d=change(d,'save',{...expense,day:'2026-09-23',amount:'500',vat:'0',category:'cotisations urssaf'});
 let f=financeSummary(d,2026);
 assert.equal(f.vatPaid,100000);
 assert.equal(f.urssafPaid,50000);
 assert.equal(f.vatNet,131333);
 assert.equal(f.urssafReserve,250417);
 d=change(d,'save',{...expense,day:'2026-09-24',amount:'100',vat:'0',category:'TVA payée'});
 d=change(d,'save',{...expense,day:'2026-09-25',amount:'50',vat:'0',category:'Paiement URSSAF'});
 f=financeSummary(d,2026);
 assert.equal(f.vatPaid,110000);
 assert.equal(f.urssafPaid,55000);
 d=change(d,'save',{...expense,day:'2026-09-26',amount:'25',vat:'0',category:'Paiement TVA'});
 d=change(d,'save',{...expense,day:'2026-09-27',amount:'25',vat:'0',category:'URSSAF'});
 f=financeSummary(d,2026);
 assert.equal(f.vatPaid,112500);
 assert.equal(f.urssafPaid,57500);
 d=change(d,'save',{...expense,day:'2026-09-28',amount:'2000',vat:'333.33',category:'virement personnel'});
 f=financeSummary(d,2026);
 assert.equal(f.vatDeductible,2000);
 assert.equal(f.reserved,361750);
});
test('Module TVA/URSSAF : paiements guidés sans TVA ni justificatif obligatoire',()=>{
 let d=change(empty(),'setup',setup);
 d=change(d,'saveRevenue',{...revenue,day:'2026-09-20',amount:'14000',vat:'0'});
 d=change(d,'save',{...expense,day:'2026-09-22',amount:'1000',vat:'0',label:'Paiement TVA',category:'TVA reversée',payment:'Virement',receiptExempt:true});
 d=change(d,'save',{...expense,day:'2026-09-23',amount:'500',vat:'0',label:'Paiement URSSAF',category:'Cotisations URSSAF',payment:'Virement',receiptExempt:true});
 assert.equal(d.expenses.at(-2).vat_cents,0);
 assert.equal(d.expenses.at(-2).receiptExempt,true);
 assert.equal(d.expenses.at(-1).vat_cents,0);
 assert.equal(d.expenses.at(-1).receiptExempt,true);
 const f=financeSummary(d,2026);
 assert.equal(f.vatPaid,100000);
 assert.equal(f.urssafPaid,50000);
 assert.equal(f.vatNet,133333);
 assert.equal(f.urssafReserve,250417);
});
test('Audit calculs : recettes modifiées/supprimées et provisions ignorées correctement',()=>{
 let d=change(empty(),'setup',{day:'2026-01-01',balance:'1000',next:'1'});
 d=change(d,'saveRevenue',{day:'2026-01-10',amount:'14000',vat:'0',label:'Commission A',category:'Commission immobilière',notes:''});
 d=change(d,'saveRevenue',{day:'2026-02-10',amount:'1200',vat:'200',label:'Autre recette',category:'Autre recette',notes:''});
 d=change(d,'save',{day:'2026-02-11',amount:'120',vat:'20',label:'Restaurant',category:'Restaurant',payment:'Carte pro',notes:''});
 let f=financeSummary(d,2026);
 assert.equal(f.revenueHt,1266667);
 assert.equal(f.vatCollected,253333);
 assert.equal(f.vatDeductible,2000);
 assert.equal(f.vatNet,251333);
 assert.equal(f.urssafGenerated,326167);
 assert.equal(f.reserved,577500);
 d=change(d,'saveRevenue',{day:'2026-01-10',amount:'28000',vat:'0',label:'Commission A modifiée',category:'Commission immobilière',notes:'',id:1});
 let s=commissionSummary(d.revenues,2026);
 assert.equal(s.baseHt,3333333);
 assert.equal(s.advisorHt,2333333);
 assert.equal(s.vat,466667);
 f=financeSummary(d,2026);
 assert.equal(f.revenueHt,2433333);
 assert.equal(f.vatCollected,486667);
 assert.equal(f.vatNet,484667);
 assert.equal(f.urssafGenerated,626583);
 d=change(d,'removeRevenue',1);
 s=commissionSummary(d.revenues,2026);
 assert.equal(s.count,0);
 assert.equal(s.baseHt,0);
 f=financeSummary(d,2026);
 assert.equal(f.revenueHt,100000);
 assert.equal(f.vatCollected,20000);
 assert.equal(f.vatNet,18000);
 assert.equal(f.urssafGenerated,25750);
});
test('Dashboard : chiffre d’affaires limité aux commissions immobilières',()=>{
 let d=change(empty(),'setup',{day:'2026-01-01',balance:'1000',next:'1'});
 d=change(d,'saveRevenue',{day:'2026-01-10',amount:'14000',vat:'0',label:'Commission A',category:'Commission immobilière',notes:''});
 d=change(d,'saveRevenue',{day:'2026-02-10',amount:'1200',vat:'200',label:'Remboursement',category:'Autre recette',notes:''});
 d=change(d,'save',{day:'2026-02-11',amount:'120',vat:'20',label:'Restaurant',category:'Restaurant',payment:'Carte pro',notes:''});
 const s=dashboardSummary(d,'2026-12-31');
 assert.equal(s.revenueTotal,1400000);
 assert.equal(s.balance,1608000);
});
test('Audit calculs : arrondis commission aux paliers validés',()=>{
 const exact=[
  {previousHt:'33333.34',agencyTtc:'20000',share:'100',advisorTtc:1466000,advisorHt:1221667,urssaf:312747,net:908920,nextHt:5000001},
  {previousHt:'33333.34',agencyTtc:'20000',share:'50',advisorTtc:716000,advisorHt:596667,urssaf:152747,net:443920,nextHt:4166668},
  {previousHt:'0',agencyTtc:'20000',share:'100',advisorTtc:1400000,advisorHt:1166667,urssaf:298667,net:868000,nextHt:1666667},
  {previousHt:'0',agencyTtc:'20000',share:'50',advisorTtc:700001,advisorHt:583334,urssaf:149334,net:434000,nextHt:833334}
 ];
 for(const c of exact){const r=calcCommission(c);assert.equal(r.advisorTtc,c.advisorTtc);assert.equal(r.advisorHt,c.advisorHt);assert.equal(r.urssaf,c.urssaf);assert.equal(r.net,c.net);assert.equal(r.nextHt,c.nextHt);}
});
