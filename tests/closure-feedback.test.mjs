import test from 'node:test';
import assert from 'node:assert/strict';
import {saveBankAction} from '../closure-feedback.mjs';
test('Clôture : confettis seulement après enregistrement réussi, jamais en cas d’erreur disque',async()=>{
 let resolve;const write=new Promise(r=>resolve=r),events=[];
 const pending=saveBankAction(()=>write,'closeBank',{},()=>events.push('celebration'));
 assert.deepEqual(events,[]);resolve();await pending;assert.deepEqual(events,['celebration']);
 events.length=0;await assert.rejects(saveBankAction(async()=>{throw Error('Écriture refusée');},'closeBank',{},()=>events.push('celebration')),/Écriture refusée/);assert.deepEqual(events,[]);
});
test('Clôture : pointage et réouverture sans confettis, panne visuelle sans faux échec comptable',async()=>{
 let count=0;for(const action of ['clearBank','reopenBank'])await saveBankAction(async()=>{},action,{},()=>count++);assert.equal(count,0);
 await saveBankAction(async()=>count++,'closeBank',{},()=>{throw Error('Canvas indisponible');});assert.equal(count,1);
});
