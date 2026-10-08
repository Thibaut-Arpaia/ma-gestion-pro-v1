import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,change,validate,financeSummary,pendingBankControls} from '../model.mjs';
import {autoClearMatches,bankSummary,bankRows,parseBankCsv} from '../reconciliation.mjs';
const expense={day:'2026-10-02',amount:'120',vat:'20',label:'Restaurant',category:'Restaurant',payment:'Carte pro',notes:''};
const revenue={day:'2026-10-01',amount:'1200',vat:'200',label:'Recette',category:'Autre recette',notes:''};
function base(){let d=change(empty(),'setup',{day:'2026-10-01',balance:'1000',next:'1'});d=change(d,'save',expense);return change(d,'saveRevenue',revenue);}
function point(d,kind,id,day){return change(d,'clearBank',{kind,id,day});}
test('Rapprochement : solde initial, pointage, dates réelles et dépointage',()=>{
 let d=base();assert.deepEqual(bankSummary(d,'2026-10-31'),{expected:100000,pending:2,cleared:0});
 const finance=financeSummary(d,2026);d=point(d,'revenue',1,'2026-10-03');assert.equal(bankSummary(d,'2026-10-02').expected,100000);assert.equal(bankSummary(d,'2026-10-03').expected,220000);
 d=point(d,'expense',1,'2026-10-04');assert.equal(bankSummary(d,'2026-10-31').expected,208000);assert.equal(bankSummary(d,'2026-10-31').pending,0);assert.deepEqual(financeSummary(d,2026),finance);
 d=change(d,'clearBank',{kind:'expense',id:1,cleared:false});assert.equal(bankSummary(d,'2026-10-31').expected,220000);assert.equal(bankSummary(d,'2026-10-31').pending,1);
 assert.throws(()=>point(d,'expense',1,'2026-09-30'));assert.throws(()=>point(d,'other',1,'2026-10-02'));assert.throws(()=>point(d,'expense',999,'2026-10-02'));
});
test('Contrôles Dashboard : pointages en attente limités à aujourd’hui',()=>{
 const rows=[{day:'2026-10-01',label:'À pointer'},{day:'2026-10-02',label:'Pointée',clearedDay:'2026-10-02'},{day:'2026-10-03',label:'Future'}];
 assert.deepEqual(pendingBankControls(rows,'2026-10-02').map(r=>r.label),['À pointer']);
 assert.deepEqual(pendingBankControls(rows,'2026-10-03').map(r=>r.label),['À pointer','Future']);
 assert.throws(()=>pendingBankControls(rows,'2026-02-30'));
});
test('Clôture : écart nul, opérations pointées, verrouillage puis réouverture',()=>{
 let d=base();assert.throws(()=>change(d,'closeBank',{end:'2026-10-31',balance:'1000'}),/attente/);
 d=point(d,'expense',1,'2026-10-02');d=point(d,'revenue',1,'2026-10-01');assert.throws(()=>change(d,'closeBank',{end:'2026-10-31',balance:'2080.01'}),/écart/);
 d=change(d,'closeBank',{end:'2026-10-31',balance:'2080'});assert.equal(d.bankClosures.length,1);assert.deepEqual(validate(JSON.parse(JSON.stringify(d))),d);
 assert.throws(()=>change(d,'save',{...expense,id:1,amount:'130'}),/clôturée/);assert.throws(()=>change(d,'remove',1),/clôturée/);assert.throws(()=>change(d,'clearBank',{kind:'revenue',id:1,cleared:false}),/clôturée/);
 assert.throws(()=>change(d,'saveRevenue',revenue),/clôturée/);assert.throws(()=>change(d,'closeBank',{end:'2026-10-31',balance:'2080'}));
 d=change(d,'save',{...expense,id:1,notes:'Ticket vérifié'});assert.equal(d.bankClosures.length,1);
 d=change(d,'reopenBank',{});d=change(d,'save',{...expense,id:1,amount:'130'});assert.equal(d.expenses[0].clearedDay,undefined);assert.equal(bankSummary(d,'2026-10-31').pending,1);
});
test('Rapprochement : historique, périodes suivantes, solde négatif et validation',()=>{
 let d=base();d=change(d,'save',{...expense,day:'2026-09-01'});assert.equal(bankRows(d).length,2);assert.throws(()=>point(d,'expense',2,'2026-10-02'));
 d=point(d,'expense',1,'2026-10-02');d=point(d,'revenue',1,'2026-10-01');d=change(d,'closeBank',{end:'2026-10-31',balance:'2080'});
 d=change(d,'save',{...expense,day:'2026-11-01',amount:'3000'});d=point(d,'expense',3,'2026-11-02');assert.equal(bankSummary(d,'2026-11-30').expected,-92000);
 d=change(d,'closeBank',{end:'2026-11-30',balance:'-920'});assert.equal(d.bankClosures.length,2);d=change(d,'reopenBank',{});assert.equal(d.bankClosures.length,1);
 assert.throws(()=>bankSummary(d,'2026-09-30'));assert.throws(()=>bankSummary(d,'2026-02-30'));const invalid=structuredClone(d);invalid.bankClosures[0].bankBalance++;assert.throws(()=>validate(invalid));
 const badDate=structuredClone(d);badDate.expenses[0].clearedDay='2026-02-30';assert.throws(()=>validate(badDate));
});

test('Import bancaire CSV : pointage automatique seulement sur correspondance unique',()=>{
 let d=base();
 const entries=parseBankCsv('Date;Libellé;Débit;Crédit\n02/10/2026;Restaurant;120,00;\n03/10/2026;Recette;;1200,00\n');
 assert.deepEqual(entries.map(e=>e.cents),[-12000,120000]);
 assert.deepEqual(autoClearMatches(d,entries).map(m=>[m.kind,m.id,m.clearedDay]),[['expense',1,'2026-10-02'],['revenue',1,'2026-10-03']]);
 d=change(d,'autoClearBank',{entries});
 assert.equal(d.expenses[0].clearedDay,'2026-10-02');
 assert.equal(d.revenues[0].clearedDay,'2026-10-03');
 assert.deepEqual(financeSummary(d,2026),financeSummary(base(),2026));
 assert.equal(bankSummary(d,'2026-10-31').pending,0);
});

test('Import bancaire CSV : ambiguïtés et périodes clôturées restent protégées',()=>{
 let d=base();
 d=change(d,'save',{...expense,label:'Restaurant',amount:'120'});
 assert.equal(autoClearMatches(d,[{day:'2026-10-02',cents:-12000,label:'Restaurant'}]).length,0);
 d=change(d,'clearBank',{kind:'expense',id:1,day:'2026-10-02'});
 d=change(d,'clearBank',{kind:'revenue',id:1,day:'2026-10-01'});
 d=change(d,'clearBank',{kind:'expense',id:2,day:'2026-10-02'});
 d=change(d,'closeBank',{end:'2026-10-31',balance:'1960'});
 assert.throws(()=>change(d,'autoClearBank',{entries:[{day:'2026-10-02',cents:-12000,label:'Restaurant'}]}),/correspondance/);
 assert.throws(()=>parseBankCsv('Libellé;Montant\nRestaurant;-120,00'),/Colonnes CSV/);
});
