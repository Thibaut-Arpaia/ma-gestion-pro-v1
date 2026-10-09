import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,change,dashboardSummary,periodReport,financeSummary} from '../model.mjs';
const day='2026-10-02';
const expense={day:'2026-10-15',label:'Abonnement',category:'Abonnement',amount:'24',vat:'4',payment:'Prélèvement',notes:''};
const revenue={day:'2026-09-20',label:'Commission',category:'Commission immobilière',amount:'14000',vat:'0',notes:''};
function base(){return change(change(empty(),'setup',{day:'2026-01-01',balance:'1000',next:1}),'saveRevenue',revenue);}
function indicators(d,at=day){const {balance,freeCash,finance}=dashboardSummary(d,at);return {balance,freeCash,finance};}
test('Aujourd’hui : échéances futures TVA, URSSAF et virement sans effet sur les indicateurs',()=>{
 let d=base();const before=indicators(d);assert.equal(before.balance,1500000);assert.equal(before.finance.vatNet,233333);assert.equal(before.finance.urssafReserve,298667);assert.equal(before.finance.taxReserve,86800);assert.equal(before.freeCash,881200);
 for(const [category,amount,vat] of [['Abonnement','24','4'],['TVA reversée','1000','0'],['Cotisations URSSAF','500','0'],['Virement personnel','2000','0']]){
 d=change(d,'saveRecurring',{...expense,category,amount,vat,day:15,start:'2026-10'});
 d=change(d,'issueRecurring',{id:d.recurring.at(-1).id,month:'2026-10'});
 assert.deepEqual(indicators(d),before);
 }
 assert.equal(periodReport(d,2026,10).outgoings,352400);
 const due=indicators(d,'2026-10-15');assert.equal(due.balance,1147600);assert.equal(due.finance.vatNet,132933);assert.equal(due.finance.urssafReserve,248667);assert.equal(due.finance.taxReserve,86800);assert.equal(due.freeCash,679200);
 assert.deepEqual(indicators(JSON.parse(JSON.stringify(d))),before);
});
test('Aujourd’hui : recettes futures et année suivante exclues, date du jour incluse',()=>{
 let d=base();const before=indicators(d);
 d=change(d,'saveRevenue',{...revenue,day:'2026-10-03'});d=change(d,'saveRevenue',{...revenue,day:'2027-01-01'});
 d=change(d,'save',{...expense,day:'2027-01-01'});assert.deepEqual(indicators(d),before);
 assert.equal(periodReport(d,2026).income,2800000);
 assert.equal(indicators(d,'2026-10-03').balance,2900000);
 d=change(d,'save',{...expense,day});assert.equal(indicators(d).balance,1497600);assert.equal(indicators(d).finance.vatNet,232933);
});
test('Aujourd’hui : modification, annulation et historique préservent les limites de date',()=>{
 let d=base();const before=indicators(d);d=change(d,'save',expense);assert.deepEqual(indicators(d),before);
 d=change(d,'save',{...expense,id:1,day});assert.equal(indicators(d).balance,1497600);
 d=change(d,'remove',1);assert.deepEqual(indicators(d),before);
 d=change(d,'saveRevenue',{...revenue,day:'2026-10-03'});d=change(d,'removeRevenue',2);assert.deepEqual(indicators(d,'2026-10-03'),before);
 d=change(d,'save',{...expense,day:'2025-12-31'});assert.deepEqual(indicators(d),before);
 assert.throws(()=>dashboardSummary(d,'2026-02-30'));assert.throws(()=>financeSummary(d,2026,'invalid'));
});
