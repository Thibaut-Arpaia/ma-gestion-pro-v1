import test from 'node:test';
import assert from 'node:assert/strict';
import {duplicateCandidates} from '../model.mjs';
const row={id:1,day:'2026-10-02',cents:1250,label:'Café du Marché',cancelled:false};
const input={day:row.day,amount:'12,50',label:'  CAFE   DU MARCHE! '};
test('Doublons : accents, casse, ponctuation, montant français et espaces',()=>{assert.equal(duplicateCandidates([row],input).length,1);assert.equal(duplicateCandidates([row],{...input,amount:'12.50'}).length,1);});
test('Doublons : modification propre, annulées et différences ne déclenchent pas',()=>{for(const changes of [{id:'1'},{day:'2026-10-01'},{amount:'12.51'},{label:'Autre commerce'}])assert.equal(duplicateCandidates([row],{...input,...changes}).length,0);assert.equal(duplicateCandidates([{...row,cancelled:true}],input).length,0);assert.equal(duplicateCandidates([] ,input).length,0);});
test('Doublons : tous les candidats actifs et catégorie différente',()=>{assert.equal(duplicateCandidates([row,{...row,id:2,category:'Autre'}],input).length,2);assert.equal(duplicateCandidates([row,{...row,id:2}],{...input,id:1}).length,1);});
