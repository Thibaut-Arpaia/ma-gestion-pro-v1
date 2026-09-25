export const payments=['Carte pro','Prélèvement','Virement','Espèces','Autre'];
export function money(v){if(!['string','number'].includes(typeof v))throw Error('Montant invalide.');const s=String(v).replace(/[\s\u00a0\u202f]/g,'').replace(',','.');if(!/^-?\d+(\.\d{1,2})?$/.test(s))throw Error('Deux décimales au maximum.');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||Math.abs(n)>1e11)throw Error('Montant hors limite.');return n;}
export function date(s){const d=new Date(`${s}T12:00:00Z`);return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
export function empty(){return {format:'ma-gestion-pro',version:1,revision:0,setup:null,next:null,expenses:[]};}
const integer=n=>Number.isSafeInteger(n)&&Math.abs(n)<=1e11;
function renumber(d){
 if(!d.setup)return d;
 const active=d.expenses.filter(r=>!r.cancelled&&!r.historical).sort((a,b)=>a.id-b.id);
 active.forEach((r,i)=>{r.ref=d.setup.first+i;});
 d.next=d.setup.first+active.length;
 return d;
}
export function validate(d){
 if(!d||d.format!=='ma-gestion-pro'||d.version!==1||!Number.isSafeInteger(d.revision)||d.revision<0||!Array.isArray(d.expenses))throw Error('Fichier Ma Gestion Pro invalide ou version incompatible.');
 if(d.setup===null){if(d.expenses.length||d.next!==null)throw Error('Point de départ absent.');return d;}
 if(!d.setup||!date(d.setup.day)||!integer(d.setup.balance)||!integer(d.setup.first)||d.setup.first<1||!integer(d.next)||d.next<d.setup.first)throw Error('Paramètres invalides.');
 const refs=new Set(),ids=new Set();for(const r of d.expenses){
 if(!r||!Number.isSafeInteger(r.id)||r.id<1||ids.has(r.id)||!date(r.day)||typeof r.label!=='string'||!r.label.trim()||r.label.length>200||typeof r.category!=='string'||!r.category.trim()||r.category.length>80||!integer(r.cents)||r.cents<=0||!integer(r.vat_cents)||r.vat_cents<0||r.vat_cents>r.cents||!payments.includes(r.payment)||typeof r.notes!=='string'||r.notes.length>1000||typeof r.historical!=='boolean'||typeof r.cancelled!=='boolean'||r.historical!==(r.day<d.setup.day))throw Error('Une dépense du fichier est invalide.');
 ids.add(r.id);if(r.ref!==null){if(!integer(r.ref)||r.ref<1||(r.historical?r.ref>=d.setup.first:r.ref<d.setup.first))throw Error('Numérotation incohérente.');if(!r.cancelled){if(refs.has(r.ref)||r.ref>=d.next)throw Error('Numérotation incohérente.');refs.add(r.ref);}}else if(!r.historical&&!r.cancelled)throw Error('Référence manquante.');
 }return d;
}
export function change(source,action,p){const d=structuredClone(validate(source));
 if(action==='setup'){if(d.setup)throw Error('Le point de départ est déjà enregistré.');const n=Number(p.next);if(!date(p.day)||!integer(n)||n<1)throw Error('Date ou premier numéro invalide.');d.setup={day:p.day,balance:money(p.balance),first:n};d.next=n;}
 else if(action==='save'){
 if(!d.setup)throw Error('Enregistre ton point de départ dans Réglages.');
 const v={day:p.day,label:String(p.label||'').trim(),category:String(p.category||'').trim(),cents:money(p.amount),vat_cents:money(p.vat||'0'),payment:p.payment,notes:String(p.notes||'').trim()};v.historical=v.day<d.setup.day;
 if(p.id){const old=d.expenses.find(r=>r.id===p.id&&!r.cancelled);if(!old)throw Error('Dépense introuvable.');if(old.historical!==v.historical)throw Error('La date doit rester du même côté du point de départ. Annule puis recrée cette dépense pour la déplacer.');Object.assign(old,v);}
 else{const ref=v.historical?(p.ref?Number(p.ref):null):null;const id=d.expenses.reduce((m,r)=>Math.max(m,r.id),0)+1;d.expenses.push({...v,ref,id,cancelled:false});}
 }else if(action==='remove'){const r=d.expenses.find(r=>r.id===p&&!r.cancelled);if(!r)throw Error('Dépense introuvable.');r.cancelled=true;}
 else throw Error('Action inconnue.');renumber(d);d.revision++;return validate(d);
}
export function visible(d){return d.expenses.filter(r=>!r.cancelled).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);}
