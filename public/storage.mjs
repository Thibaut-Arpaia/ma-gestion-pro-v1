import {empty,validate,change,visible,visibleRevenues} from './model.mjs';
let directory=null;
const filename='ma-gestion-pro.json';
const fileLimit=35000000;
const backgroundFolder='fonds';
async function read(){try{const h=await directory.getFileHandle(filename);const f=await h.getFile();if(f.size>fileLimit)throw Error('Fichier trop volumineux.');return validate(JSON.parse(await f.text()));}catch(e){if(e.name==='NotFoundError')return empty();throw e;}}
async function write(handle,data){const json=JSON.stringify(data,null,2);if(new Blob([json]).size>fileLimit)throw Error('Le dossier atteint la limite de 35 Mo. Réduis la taille des tickets ou du fond personnalisé avant de recommencer.');const stream=await handle.createWritable();try{await stream.write(json);await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}}
async function snapshot(data){const dir=await directory.getDirectoryHandle('sauvegardes',{create:true});const name=`comptes-${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomUUID()}.json`;await write(await dir.getFileHandle(name,{create:true}),data);return name;}
const extByType={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};
function bytesFromBase64(data){if(typeof atob==='function')return Uint8Array.from(atob(data),c=>c.charCodeAt(0));return Uint8Array.from(Buffer.from(data,'base64'));}
function base64FromBytes(bytes){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.slice(i,i+0x8000));if(typeof btoa==='function')return btoa(s);return Buffer.from(bytes).toString('base64');}
async function writeBackgroundAsset(bg){const dir=await directory.getDirectoryHandle(backgroundFolder,{create:true});const name=`fond-${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomUUID()}${extByType[bg.type]}`;const handle=await dir.getFileHandle(name,{create:true});const stream=await handle.createWritable();try{await stream.write(new Blob([bytesFromBase64(bg.data)],{type:bg.type}));await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}return {name:bg.name,type:bg.type,size:bg.size,path:`${backgroundFolder}/${name}`};}
async function readBackgroundData(bg){if(!bg?.path)return bg;const [folder,file]=bg.path.split('/');const handle=await (await directory.getDirectoryHandle(folder)).getFileHandle(file);const image=await handle.getFile();const bytes=new Uint8Array(await image.arrayBuffer());return {...bg,data:base64FromBytes(bytes)};}
async function hydrateBackground(d){const copy=structuredClone(d);if(copy.preferences?.background?.path&&!copy.preferences.background.data)copy.preferences.background=await readBackgroundData(copy.preferences.background);return copy;}
async function state(d){const hydrated=await hydrateBackground(d);return {...hydrated,expenses:visible(hydrated),revenues:visibleRevenues(hydrated),dataPath:directory?`${directory.name}/${filename}`:'Aucun dossier ouvert',backupFolder:directory?`${directory.name}/sauvegardes`:null,connected:!!directory};}
async function locked(fn){if(!directory)throw Error('Choisis d’abord ton dossier dans Réglages.');if(!navigator.locks)throw Error('Ce navigateur ne permet pas de sécuriser les écritures.');return navigator.locks.request('ma-gestion-pro-local-write',fn);}
export async function run(action,p){
 if(action==='state')return directory?await state(await read()):await state(empty());
 if(action==='connect'){
 if(!window.isSecureContext||!window.showDirectoryPicker||!navigator.locks)throw Error('L’accès direct au dossier nécessite une adresse HTTPS et un navigateur compatible. Essaie Chrome ou Edge sur PC.');
 const next=await window.showDirectoryPicker({id:'ma-gestion-pro',mode:'readwrite'});const previous=directory;directory=next;try{return await state(await read());}catch(e){directory=previous;throw e;}
 }
 if(action==='restore'){
 if(!directory)throw Error('Choisis d’abord ton dossier.');
 const [handle]=await window.showOpenFilePicker({types:[{description:'Sauvegarde Ma Gestion Pro',accept:{'application/json':['.json']}}],multiple:false});const file=await handle.getFile();if(file.size>fileLimit)throw Error('Fichier trop volumineux.');const candidate=validate(JSON.parse(await file.text()));
 if(!window.confirm('Remplacer les comptes de ce dossier par cette sauvegarde ? Une copie de l’état actuel sera conservée.'))return {cancelled:true};
 return locked(async()=>{const old=await read();await snapshot(old);const background=candidate.preferences?.background?.data?await writeBackgroundAsset(candidate.preferences.background):candidate.preferences?.background;const restored={...candidate,preferences:{...candidate.preferences,background},revision:Math.max(candidate.revision,old.revision)+1};await write(await directory.getFileHandle(filename,{create:true}),restored);return await state(restored);});
 }
 if(action==='exportData'){
 if(!directory)throw Error('Choisis d’abord ton dossier.');
 const data=validate(await read()),name=`ma-gestion-pro-export-${new Date().toISOString().slice(0,10)}.json`;
 return {name,json:JSON.stringify(await hydrateBackground(data),null,2)};
 }
 return locked(async()=>{const before=await read();if(action==='backup')return {...(await state(before)),file:await snapshot(before)};const payload=action==='saveBackground'?await writeBackgroundAsset(p):p;const after=change(before,action,payload);await snapshot(before);await write(await directory.getFileHandle(filename,{create:true}),after);return await state(after);});
}
window.gestion={call:async(action,p)=>{try{return {ok:true,data:await run(action,p)};}catch(e){return {ok:false,error:e.name==='AbortError'?'Sélection annulée.':e.name==='NotAllowedError'?'Accès refusé : rouvre ton dossier pour autoriser l’enregistrement.':e.message||'Enregistrement impossible.'};}}};
