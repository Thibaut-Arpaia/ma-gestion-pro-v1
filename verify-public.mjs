import {readdir,readFile,access} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'public');
for(const name of await readdir(root)){
 if(!/\.(mjs|js|html|css)$/.test(name))continue;
 const content=await readFile(path.join(root,name),'utf8');
 let refs;
 if(/\.(mjs|js)$/.test(name))refs=[
  ...[...content.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.\.?\/[^'"]+)['"]/g)].map(m=>m[1]),
  ...[...content.matchAll(/\bnew\s+Audio\s*\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m=>m[1])
 ];
 else if(name.endsWith('.html'))refs=[...content.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]);
 else refs=[...content.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>m[1]);
 for(const ref of refs){if(/^(data:|https?:|#)/.test(ref))continue;const file=path.resolve(root,ref.split(/[?#]/)[0]);if(!file.startsWith(root+path.sep))throw Error('Référence hors des fichiers publics : '+ref);try{await access(file);}catch{throw Error('Dépendance manquante dans la publication : '+name+' → '+ref);}}
}
console.log('Dépendances des fichiers publics vérifiées.');
