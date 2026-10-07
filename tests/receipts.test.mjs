import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,change,validate,financeSummary} from '../model.mjs';
import {missingReceipts,validateReceipt} from '../receipts.mjs';
const receipt={name:'ticket.pdf',type:'application/pdf',size:9,data:Buffer.from('%PDF-1.4\n').toString('base64')};
const expense={day:'2026-10-02',amount:'120',vat:'20',label:'Restaurant',category:'Restaurant',payment:'Carte pro',notes:''};
const base=()=>change(empty(),'setup',{day:'2026-01-01',balance:'1000',next:'1'});
test('Justificatifs : ajout, modification sans perte, remplacement, retrait et corbeille',()=>{
 let d=change(base(),'save',expense);assert.equal(missingReceipts(d.expenses),1);
 d=change(d,'save',{...expense,id:1,receipt});assert.equal(missingReceipts(d.expenses),0);
 const finances=financeSummary(d,2026);
 d=change(d,'save',{...expense,id:1,label:'Modifié'});assert.deepEqual(d.expenses[0].receipt,receipt);
 d=change(d,'save',{...expense,id:1,receipt:{...receipt,name:'nouveau.pdf'}});assert.equal(d.expenses[0].receiptTrash.length,1);
 d=change(d,'save',{...expense,id:1,removeReceipt:true});assert.equal(missingReceipts(d.expenses),1);assert.equal(d.expenses[0].receiptTrash.length,2);
 d=change(d,'restoreReceipt',{id:1,index:0});assert.equal(d.expenses[0].receipt.name,'ticket.pdf');assert.equal(missingReceipts(d.expenses),0);
 assert.deepEqual(financeSummary(d,2026),finances);
 assert.deepEqual(validate(JSON.parse(JSON.stringify(d))),d);
 d=change(d,'remove',1);assert.equal(missingReceipts(d.expenses),0);assert.ok(d.expenses[0].receipt);
});
test('Justificatifs : exonération, anciens dossiers et paiements de provisions',()=>{
 let d=change(base(),'save',expense);assert.doesNotThrow(()=>validate(d));
 d=change(d,'save',{...expense,id:1,receiptExempt:true});assert.equal(missingReceipts(d.expenses),0);
 d=change(d,'save',{...expense,id:1,receiptExempt:false});assert.equal(missingReceipts(d.expenses),1);
 for(const category of ['TVA reversée','tva reverse','TVA payée','Paiement TVA','Cotisations URSSAF','Paiement URSSAF','Impôt','virement personnel'])d=change(d,'save',{...expense,category});
 assert.equal(missingReceipts(d.expenses),1);
});
test('Justificatifs : formats, taille et données invalides refusés',()=>{
 assert.throws(()=>validateReceipt({...receipt,size:5000001}));
 assert.throws(()=>validateReceipt({...receipt,type:'text/html'}));
 assert.throws(()=>validateReceipt({...receipt,data:'AAAAAAAAAAAA'}));
 assert.throws(()=>change(base(),'save',{...expense,receipt:{...receipt,data:'invalide'}}));
 let d=change(base(),'save',{...expense,receipt});
 assert.throws(()=>change(d,'restoreReceipt',{id:1,index:-1}));
 d.expenses[0].receiptTrash=[{...receipt,size:0}];assert.throws(()=>validate(d));
});
