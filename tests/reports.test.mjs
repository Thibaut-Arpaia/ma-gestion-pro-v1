import test from 'node:test';
import assert from 'node:assert/strict';
import {periodReport} from '../model.mjs';
test('Bilans : mois, année, historique, annulations, centimes et solde initial',()=>{
 const d={setup:{balance:100000},revenues:[{day:'2026-01-01',cents:120000},{day:'2026-02-01',cents:1400000},{day:'2025-01-01',cents:999},{day:'2026-02-02',cents:900,cancelled:true}],expenses:[{day:'2026-01-02',cents:12000,historical:true},{day:'2026-02-02',cents:50000},{day:'2026-02-03',cents:12345},{day:'2026-02-03',cents:900,cancelled:true}]};
 const before=JSON.stringify(d),jan=periodReport(d,2026,1),annual=periodReport(d,2026);
 assert.deepEqual([jan.income,jan.outgoings,jan.cashflow],[120000,12000,108000]);
 assert.deepEqual([annual.income,annual.outgoings,annual.cashflow],[1520000,74345,1445655]);
 assert.equal(annual.monthly.reduce((s,r)=>s+r.cashflow,0),annual.cashflow);assert.equal(JSON.stringify(d),before);
 assert.equal(periodReport(d,2027).income,0);assert.equal(periodReport(d,2026,3).cashflow,0);
});
test('Bilans : provisions TVA et URSSAF de la période',()=>{
 const d={revenues:[{day:'2026-01-10',category:'Commission immobilière',cents:1400000,vat_cents:0},{day:'2026-01-11',category:'Autre recette',cents:120000,vat_cents:20000},{day:'2026-02-01',category:'Autre recette',cents:120000,vat_cents:20000},{day:'2026-01-12',category:'Autre recette',cents:120000,vat_cents:20000,cancelled:true}],expenses:[{day:'2026-01-13',category:'Restaurant',cents:12000,vat_cents:2000},{day:'2026-01-14',category:'tva reverse',cents:100000,vat_cents:0},{day:'2026-01-15',category:'cotisations urssaf',cents:50000,vat_cents:0},{day:'2026-01-16',category:'TVA payée',cents:999999,vat_cents:0,cancelled:true},{day:'2026-01-17',category:'Paiement URSSAF',cents:999999,vat_cents:0,cancelled:true},{day:'2026-01-18',category:'Restaurant',cents:999999,vat_cents:166667,cancelled:true},{day:'2026-02-02',category:'Restaurant',cents:12000,vat_cents:2000}]};
 const jan=periodReport(d,2026,1).fiscal;
 assert.deepEqual([jan.revenueHt,jan.vatCollected,jan.vatDeductible,jan.vatPaid,jan.vatNet],[1266667,253333,2000,100000,151333]);
 assert.deepEqual([jan.urssafGenerated,jan.urssafPaid,jan.urssafReserve,jan.reserved],[326167,50000,276167,427500]);
 const annual=periodReport(d,2026).fiscal;
 assert.equal(annual.vatCollected,273333);
 assert.equal(annual.vatDeductible,4000);
 assert.equal(annual.vatNet,169333);
 assert.equal(annual.urssafGenerated,351917);
 assert.equal(annual.reserved,471250);
});
test('Bilans : enveloppes cumulées au dernier jour consulté',()=>{
 const d={revenues:[{day:'2026-01-10',category:'Autre recette',cents:120000,vat_cents:20000},{day:'2026-02-10',category:'Autre recette',cents:120000,vat_cents:20000},{day:'2026-03-10',category:'Autre recette',cents:120000,vat_cents:20000}],expenses:[{day:'2026-01-20',category:'TVA payée',cents:5000,vat_cents:0},{day:'2026-02-20',category:'Paiement URSSAF',cents:10000,vat_cents:0}]};
 const jan=periodReport(d,2026,1).envelope,feb=periodReport(d,2026,2).envelope,annual=periodReport(d,2026).envelope;
 assert.deepEqual([jan.vatNet,jan.urssafReserve,jan.reserved],[15000,25750,40750]);
 assert.deepEqual([feb.vatNet,feb.urssafReserve,feb.reserved],[35000,41500,76500]);
 assert.deepEqual([annual.vatNet,annual.urssafReserve,annual.reserved],[55000,67250,122250]);
});
test('Bilans : période invalide et trésorerie négative',()=>{assert.throws(()=>periodReport({},2026,13));assert.throws(()=>periodReport({},NaN));assert.equal(periodReport({expenses:[{day:'2026-01-01',cents:1250}]},2026).cashflow,-1250);});
