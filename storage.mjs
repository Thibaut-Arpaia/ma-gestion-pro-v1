import {empty,validate,change,visible} from './model.mjs';
let directory=null;
const filename='ma-gestion-pro.json';
async function read(){try{const h=await directory.getFileHandle(filename);const f=await h.getFile();if(f.size>20000000)throw Error('Fichier trop volumineux.');return validate(JSON.parse(await f.text()));}catch(e){if(e.name==='NotFoundError')return empty();throw e;}}
async function write(handle,data){const stream=await handle.createWritable();try{await stream.write(JSON.stringify(data,null,2));await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}}
async function snapshot(data){const dir=await directory.getDirectoryHandle('sauvegardes',{create:true});const name=`comptes-${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomUUID()}.json`;await write(await dir.getFileHandle(name,{create:true}),data);return name;}
function state(d){return {...d,expenses:visible(d),dataPath:directory?`${directory.name}/${filename}`:'Aucun dossier ouvert',backupFolder:directory?`${directory.name}/sauvegardes`:null,connected:!!directory};}
async function locked(fn){if(!directory)throw Error('Choisis d’abord ton dossier dans Réglages.');if(!navigator.locks)throw Error('Ce navigateur ne permet pas de sécuriser les écritures.');return navigator.locks.request('ma-gestion-pro-local-write',fn);}
export async function run(action,p){
 if(action==='state')return directory?state(await read()):state(empty());
 if(action==='connect'){
 if(!window.isSecureContext||!window.showDirectoryPicker||!navigator.locks)throw Error('L’accès direct au dossier nécessite une adresse HTTPS et un navigateur compatible. Essaie Chrome ou Edge sur PC.');
 const next=await window.showDirectoryPicker({id:'ma-gestion-pro',mode:'readwrite'});const previous=directory;directory=next;try{return state(await read());}catch(e){directory=previous;throw e;}
 }
 if(action==='restore'){
 if(!directory)throw Error('Choisis d’abord ton dossier.');
 const [handle]=await window.showOpenFilePicker({types:[{description:'Sauvegarde Ma Gestion Pro',accept:{'application/json':['.json']}}],multiple:false});const file=await handle.getFile();if(file.size>20000000)throw Error('Fichier trop volumineux.');const candidate=validate(JSON.parse(await file.text()));
 if(!window.confirm('Remplacer les comptes de ce dossier par cette sauvegarde ? Une copie de l’état actuel sera conservée.'))return {cancelled:true};
 return locked(async()=>{const old=await read();await snapshot(old);const restored={...candidate,revision:Math.max(candidate.revision,old.revision)+1};await write(await directory.getFileHandle(filename,{create:true}),restored);return state(restored);});
 }
 return locked(async()=>{const before=await read();if(action==='backup')return {...state(before),file:await snapshot(before)};const after=change(before,action,p);await snapshot(before);await write(await directory.getFileHandle(filename,{create:true}),after);return state(after);});
}
window.gestion={call:async(action,p)=>{try{return {ok:true,data:await run(action,p)};}catch(e){return {ok:false,error:e.name==='AbortError'?'Sélection annulée.':e.name==='NotAllowedError'?'Accès refusé : rouvre ton dossier pour autoriser l’enregistrement.':e.message||'Enregistrement impossible.'};}}};
