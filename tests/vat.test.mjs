import test from 'node:test';
import assert from 'node:assert/strict';
import {vatFromTtc,splitVat} from '../model.mjs';
import {empty,change,validate,financeSummary} from '../model.mjs';
test('TVA depuis TTC : taux usuels, virgule et arrondis',()=>{
 for(const [ttc,rate,expected] of [[12000,20,2000],[11000,10,1000],[10550,'5,5',550],[10210,2.1,210],[10000,0,0],[4250,20,708],[999,5.5,52]])assert.equal(vatFromTtc(ttc,rate),expected);
 assert.throws(()=>vatFromTtc(100,-1));assert.throws(()=>vatFromTtc(100,'abc'));
});
test('Tickets à deux et trois taux : bases distinctes et dépassement refusé',()=>{
 assert.equal(splitVat(22550,20,[{cents:10550,rate:5.5}]).vat,2550);
 assert.equal(splitVat(33550,20,[{cents:11000,rate:10},{cents:10550,rate:5.5}]).vat,3550);
 assert.equal(splitVat(22000,20,[{cents:10000,rate:0}]).vat,2000);
 assert.throws(()=>splitVat(10000,20,[{cents:11000,rate:10}]));
});
test('Enregistrement, réouverture, modification et totaux fiscaux',()=>{
 let d=change(empty(),'setup',{day:'2026-01-01',balance:'0',next:'1'});
 d=change(d,'saveRevenue',{day:'2026-10-12',label:'Commission',category:'Commission immobilière',amount:'1200',vat_rate:20});
 d=change(d,'save',{day:'2026-10-12',label:'Ticket',category:'Fournitures',payment:'Carte pro',amount:'225.50',vat_lines:[{cents:12000,rate:20},{cents:10550,rate:5.5}]});
 d=validate(JSON.parse(JSON.stringify(d)));
 assert.equal(d.expenses[0].vat_cents,2550);assert.equal(d.expenses[0].vat_lines[1].rate,5.5);
 assert.equal(financeSummary(d,2026).vatNet,17450);
 d=change(d,'save',{id:1,day:'2026-10-12',label:'Ticket',category:'Fournitures',payment:'Carte pro',amount:'335.50',vat_lines:[{cents:12000,rate:20},{cents:11000,rate:10},{cents:10550,rate:5.5}]});
 assert.equal(d.expenses[0].vat_cents,3550);
 d=change(d,'saveRevenue',{day:'2026-10-12',label:'Autre',category:'Autre recette',amount:'110',vat_rate:10});
 assert.equal(d.revenues[1].vat_cents,1000);
 assert.equal(financeSummary(d,2026).vatCollected,21000);
});
test('Ancienne saisie sans taux : aucune conversion implicite',()=>{
 let d=change(empty(),'setup',{day:'2026-01-01',balance:'0',next:'1'});
 d=change(d,'save',{day:'2026-10-12',label:'Ancien',category:'Fournitures',payment:'Carte pro',amount:'225.50',vat:'25.50'});
 assert.equal(validate(JSON.parse(JSON.stringify(d))).expenses[0].vat_cents,2550);
 assert.equal(d.expenses[0].vat_lines,undefined);
});
