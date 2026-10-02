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
test('Bilans : période invalide et trésorerie négative',()=>{assert.throws(()=>periodReport({},2026,13));assert.throws(()=>periodReport({},NaN));assert.equal(periodReport({expenses:[{day:'2026-01-01',cents:1250}]},2026).cashflow,-1250);});
