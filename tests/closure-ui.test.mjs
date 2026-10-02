import test from 'node:test';
import assert from 'node:assert/strict';
import {initReconciliation} from '../reconciliation-ui.mjs';
import {empty,change} from '../model.mjs';
function harness(){
 const nodes=new Map(),frames=new Map(),preferences=new Map();let frameId=0;
 class Element{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.classList={toggle(){}};this.value='';this.listeners={};}
 set innerHTML(text){for(const [,id] of text.matchAll(/id="([^"]+)"/g))nodes.set('#'+id,new Element('input'));}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 insertBefore(node){this.append(node);}
 querySelector(key){if(!nodes.has(key))nodes.set(key,new Element('div'));return nodes.get(key);}
 addEventListener(name,fn){this.listeners[name]=fn;}
 removeEventListener(name){delete this.listeners[name];}
 setAttribute(name,value){this[name]=value;}
 remove(){this.removed=true;}
 getContext(){return {clearRect(){},fillRect(){}};}
 }
 const body=new Element('body');
 const doc={body,hidden:false,createElement:tag=>new Element(tag),createTextNode:text=>({text}),querySelector:key=>{if(!nodes.has(key))nodes.set(key,new Element('div'));return nodes.get(key);},addEventListener(){},removeEventListener(){}};
 const originals={};for(const key of ['document','window','localStorage','requestAnimationFrame','cancelAnimationFrame'])originals[key]=Object.getOwnPropertyDescriptor(globalThis,key);
 Object.assign(globalThis,{document:doc,window:{confirm:()=>true,innerWidth:1200,innerHeight:800,matchMedia:()=>({matches:false})},localStorage:{getItem:key=>preferences.get(key),setItem:(key,v)=>preferences.set(key,v)},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)});
 let d=change(empty(),'setup',{day:'2026-10-01',balance:'1000',next:1});const messages=[];let fail=false;
 const ui=initReconciliation({getState:()=>d,save:async(action,p)=>{if(fail)throw Error('Écriture refusée');d=change(d,action,p);},notify:(...args)=>messages.push(args),fmt:new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}),today:()=> '2026-10-02'});
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 return {nodes,body,frames,preferences,messages,get state(){return d;},setFail(v){fail=v;},ui,tick,restore(){for(const [key,descriptor]of Object.entries(originals))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
}
test('Interface clôture : option, animation cinq secondes, réouverture et désactivation',async()=>{
 const h=harness();try{
 h.nodes.get('#bank-balance').value='1000';h.ui.render();assert.equal(h.nodes.get('#bank-close').disabled,false);
 h.nodes.get('#bank-close').onclick();await h.tick();assert.equal(h.state.bankClosures.length,1);
 const canvas=h.body.children.at(-1);assert.equal(canvas.tag,'canvas');assert.equal(h.nodes.get('#bank-close').disabled,true);
 const first=h.frames.values().next().value;first(100);const last=[...h.frames.values()].at(-1);last(5100);assert.equal(canvas.removed,true);
 h.nodes.get('#bank-reopen').onclick();await h.tick();assert.equal(h.state.bankClosures.length,0);assert.equal(h.body.children.length,1);
 const option=h.nodes.get('.form-actions').children[0].children[0];option.checked=false;option.listeners.change();assert.equal(h.preferences.get('ma-gestion-pro-closure-animation'),'off');
 h.nodes.get('#bank-close').onclick();await h.tick();assert.equal(h.state.bankClosures.length,1);assert.equal(h.body.children.length,1);
 }finally{h.restore();}
});
test('Interface clôture : erreur d’écriture et écart non nul',async()=>{
 const h=harness();try{
 h.nodes.get('#bank-balance').value='900';h.ui.render();assert.equal(h.nodes.get('#bank-close').disabled,true);
 h.nodes.get('#bank-balance').value='1000';h.ui.render();h.setFail(true);h.nodes.get('#bank-close').onclick();await h.tick();assert.equal(h.state.bankClosures,undefined);assert.equal(h.body.children.length,0);assert.deepEqual(h.messages.at(-1),['Écriture refusée',true]);assert.equal(h.nodes.get('#bank-close').disabled,false);
 }finally{h.restore();}
});
test('Interface clôture : préférence système de réduction des animations',async()=>{
 const h=harness();try{
 window.matchMedia=()=>({matches:true});h.nodes.get('#bank-balance').value='1000';h.ui.render();h.nodes.get('#bank-close').onclick();await h.tick();assert.equal(h.state.bankClosures.length,1);assert.equal(h.body.children.length,0);
 }finally{h.restore();}
});
