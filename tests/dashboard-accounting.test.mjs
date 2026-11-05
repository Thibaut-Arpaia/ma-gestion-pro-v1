import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,change,dashboardSummary,financeSummary,periodReport} from '../model.mjs';
const start=()=>change(empty(),'setup',{day:'2026-01-01',balance:'0',next:'1',initialRevenue:'0'});
const income=(d,day,amount,category='Commission immobilière',vat='0')=>change(d,'saveRevenue',{day,amount,category,vat,label:'Saisie test',notes:''});
const spending=(d,day,amount,category='Restaurant',vat='0')=>change(d,'save',{day,amount,category,vat,label:'Paiement test',payment:'Virement',notes:''});
test('Commission encaissée 18 000 TTC : CA 15 000 HT, trésorerie, TVA, URSSAF et impôts cohérents',()=>{
 const d=income(start(),'2026-11-05','18000');
 const s=dashboardSummary(d,'2026-11-05');
 assert.equal(s.revenueTotal,1500000);assert.equal(s.balance,1800000);
 assert.equal(s.finance.vatNet,300000);assert.equal(s.finance.urssafReserve,386100);
 assert.equal(s.finance.taxReserve,111390);assert.equal(s.freeCash,1002510);
});
test('CA HT : commissions seules, arrondies au centime, exclure autres recettes, respecter dates',()=>{
 let d=start();d=income(d,'2026-01-01','18000');d=income(d,'2026-01-02','1200');d=income(d,'2026-01-03','600','Autre recette','100');
 assert.equal(dashboardSummary(d,'2026-01-02').revenueTotal,1600000);
 assert.equal(dashboardSummary(d,'2026-01-03').revenueTotal,1600000);
 assert.equal(dashboardSummary(d,'2026-01-01').revenueTotal,1500000);
 assert.equal(periodReport(d,2026).income,1980000);
});
test('CA initial en HT : ajouté une seule fois pour son année, sans toucher au solde bancaire',()=>{
 let d=change(empty(),'setup',{day:'2026-10-01',balance:'2000',next:'1',initialRevenue:'4000'});
 d=income(d,'2026-10-02','1200');d=income(d,'2027-01-02','1200');
 assert.equal(dashboardSummary(d,'2026-12-31').revenueTotal,500000);
 assert.equal(dashboardSummary(d,'2027-12-31').revenueTotal,100000);
 assert.equal(dashboardSummary(d,'2026-12-31').balance,320000);
});
test('Solde initial : une recette historique n’est pas comptée deux fois',()=>{
 let d=change(empty(),'setup',{day:'2026-10-01',balance:'5000',next:'1'});
 d=income(d,'2026-09-15','1200');d=income(d,'2026-10-02','1800');
 assert.equal(dashboardSummary(d,'2026-10-03').balance,680000);
});
test('Paiements et TVA déductible : provision restante cohérente avec solde réel',()=>{
 let d=income(start(),'2026-02-01','18000');
 d=spending(d,'2026-02-02','120','Restaurant','20');
 d=spending(d,'2026-02-03','1000','TVA reversée','0');
 d=spending(d,'2026-02-03','500','Cotisations URSSAF','0');
 d=spending(d,'2026-02-03','300','Impôt','0');
 const s=dashboardSummary(d,'2026-02-03');const f=financeSummary(d,2026,'2026-02-03');
 assert.equal(f.vatNet,198000);assert.equal(f.urssafReserve,336100);
 assert.equal(f.taxReserve,81390);assert.equal(s.balance,1608000);
 assert.equal(s.freeCash,s.balance-f.reserved);
});
