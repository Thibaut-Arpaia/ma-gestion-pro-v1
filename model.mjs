export const payments=['Carte pro','Prélèvement','Virement','Espèces','Autre'];
export function money(v){if(!['string','number'].includes(typeof v))throw Error('Montant invalide.');const s=String(v).replace(/[\s\u00a0\u202f]/g,'').replace(',','.');if(!/^-?\d+(\.\d{1,2})?$/.test(s))throw Error('Deux décimales au maximum.');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||Math.abs(n)>1e11)throw Error('Montant hors limite.');return n;}
export const commissionBrackets=[{to:3900000,rate:.70},{to:5900000,rate:.75},{to:7500000,rate:.80},{to:9000000,rate:.85},{to:Infinity,rate:.90}];
export function reverseCommissionBase(advisorHt,previousHt=0){
 if(!integer(advisorHt)||advisorHt<0||!integer(previousHt)||previousHt<0)throw Error('Commission invalide.');
 let remaining=advisorHt,position=previousHt,base=0,weighted=0,lastRate=commissionBrackets[0].rate;
 for(const b of commissionBrackets){if(remaining<=0)break;const room=b.to===Infinity?Infinity:Math.max(0,b.to-position);if(room<=0)continue;const maxAdvisor=b.to===Infinity?remaining:Math.round(room*b.rate);const advisorSlice=Math.min(remaining,maxAdvisor);const baseSlice=b.to===Infinity?Math.round(advisorSlice/b.rate):Math.min(room,Math.round(advisorSlice/b.rate));base+=baseSlice;weighted+=advisorSlice;remaining-=advisorSlice;position+=baseSlice;lastRate=b.rate;}
 if(remaining>0)throw Error('Commission hors barème.');
 return {baseHt:base,nextHt:previousHt+base,rate:base?weighted/base:0,lastRate};
}
export function calcCommission(input){
 const agencyTtc=money(input.agencyTtc),share=Number(String(input.share||'100').replace(',','.')),previousHt=money(input.previousHt||'0');
 if(agencyTtc<=0)throw Error('Commission agence invalide.');
 if(!Number.isFinite(share)||share<=0||share>100)throw Error('Part personnelle invalide.');
 if(previousHt<0)throw Error('Cumul HT invalide.');
 const vatRate=0.20,urssafRate=0.256,agencyHt=Math.round(agencyTtc/(1+vatRate)),personalBaseHt=Math.round(agencyHt*share/100);
 let remaining=personalBaseHt,position=previousHt,advisorHt=0;
 for(const b of commissionBrackets){if(remaining<=0)break;const room=b.to===Infinity?remaining:Math.max(0,b.to-position);const slice=Math.min(remaining,room);advisorHt+=Math.round(slice*b.rate);remaining-=slice;position+=slice;}
 const advisorVat=Math.round(advisorHt*vatRate),advisorTtc=advisorHt+advisorVat,urssaf=Math.round(advisorHt*urssafRate),net=advisorHt-urssaf;
 return {agencyTtc,agencyHt,share,previousHt,personalBaseHt,nextHt:previousHt+personalBaseHt,advisorHt,advisorVat,advisorTtc,urssaf,net};
}
export function commissionSummary(revenues,year){
 const rows=(revenues||[]).filter(r=>!r.cancelled&&r.category==='Commission immobilière'&&(!year||r.day.slice(0,4)===String(year))).sort((a,b)=>a.day.localeCompare(b.day)||a.id-b.id);
 let baseHt=0,advisorTtc=0,advisorHt=0,vat=0;
 for(const r of rows){const ht=Math.round(r.cents/1.2),calc=reverseCommissionBase(ht,baseHt);baseHt=calc.nextHt;advisorTtc+=r.cents;advisorHt+=ht;vat+=r.cents-ht;}
 return {count:rows.length,baseHt,advisorTtc,advisorHt,vat};
}
const provisionCats=['TVA reversée','TVA reversee','Cotisations URSSAF','URSSAF','Impôt sur le revenu','Impot sur le revenu','Impôts et taxes','Impots et taxes'];
function revenueParts(r){if(r.category==='Commission immobilière'){const ht=Math.round(r.cents/1.2);return {ht,vat:r.cents-ht};}return {ht:r.cents-r.vat_cents,vat:r.vat_cents};}
export function financeSummary(d,year){
 const revenues=(d.revenues||[]).filter(r=>!r.cancelled&&r.day.slice(0,4)===String(year)),expenses=(d.expenses||[]).filter(r=>!r.cancelled&&r.day.slice(0,4)===String(year));
 let revenueHt=0,vatCollected=0,vatDeductible=0,vatPaid=0,urssafPaid=0;
 for(const r of revenues){const p=revenueParts(r);revenueHt+=p.ht;vatCollected+=p.vat;}
 for(const r of expenses){if(provisionCats.includes(r.category)){if(r.category.includes('TVA'))vatPaid+=r.cents;if(r.category.includes('URSSAF'))urssafPaid+=r.cents;continue;}vatDeductible+=r.vat_cents;}
 const vatNet=Math.max(0,vatCollected-vatDeductible-vatPaid),urssafGenerated=Math.round(revenueHt*.2575),urssafReserve=Math.max(0,urssafGenerated-urssafPaid);
 return {revenueHt,vatCollected,vatDeductible,vatPaid,vatNet,urssafGenerated,urssafPaid,urssafReserve,reserved:vatNet+urssafReserve};
}
export function date(s){const d=new Date(`${s}T12:00:00Z`);return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
export function empty(){return {format:'ma-gestion-pro',version:1,revision:0,setup:null,next:null,expenses:[],revenues:[]};}
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
 if(!Array.isArray(d.revenues))d.revenues=[];
 if(d.setup===null){if(d.expenses.length||d.revenues.length||d.next!==null)throw Error('Point de départ absent.');return d;}
 if(!d.setup||!date(d.setup.day)||!integer(d.setup.balance)||!integer(d.setup.first)||d.setup.first<1||!integer(d.next)||d.next<d.setup.first)throw Error('Paramètres invalides.');
 const refs=new Set(),ids=new Set();for(const r of d.expenses){
 if(!r||!Number.isSafeInteger(r.id)||r.id<1||ids.has(r.id)||!date(r.day)||typeof r.label!=='string'||!r.label.trim()||r.label.length>200||typeof r.category!=='string'||!r.category.trim()||r.category.length>80||!integer(r.cents)||r.cents<=0||!integer(r.vat_cents)||r.vat_cents<0||r.vat_cents>r.cents||!payments.includes(r.payment)||typeof r.notes!=='string'||r.notes.length>1000||typeof r.historical!=='boolean'||typeof r.cancelled!=='boolean'||r.historical!==(r.day<d.setup.day))throw Error('Une dépense du fichier est invalide.');
 ids.add(r.id);if(r.ref!==null){if(!integer(r.ref)||r.ref<1||(r.historical?r.ref>=d.setup.first:r.ref<d.setup.first))throw Error('Numérotation incohérente.');if(!r.cancelled){if(refs.has(r.ref)||r.ref>=d.next)throw Error('Numérotation incohérente.');refs.add(r.ref);}}else if(!r.historical&&!r.cancelled)throw Error('Référence manquante.');
 }const revenueIds=new Set();for(const r of d.revenues){
 if(!r||!Number.isSafeInteger(r.id)||r.id<1||revenueIds.has(r.id)||!date(r.day)||typeof r.label!=='string'||!r.label.trim()||r.label.length>200||typeof r.category!=='string'||!r.category.trim()||r.category.length>80||!integer(r.cents)||r.cents<=0||!integer(r.vat_cents)||r.vat_cents<0||r.vat_cents>r.cents||typeof r.notes!=='string'||r.notes.length>1000||typeof r.cancelled!=='boolean')throw Error('Une recette du fichier est invalide.');
 revenueIds.add(r.id);
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
 else if(action==='saveRevenue'){
 if(!d.setup)throw Error('Enregistre ton point de départ dans Réglages.');
 const v={day:p.day,label:String(p.label||'').trim(),category:String(p.category||'').trim(),cents:money(p.amount),vat_cents:money(p.vat||'0'),notes:String(p.notes||'').trim()};
 if(p.id){const old=d.revenues.find(r=>r.id===p.id&&!r.cancelled);if(!old)throw Error('Recette introuvable.');Object.assign(old,v);}
 else{const id=d.revenues.reduce((m,r)=>Math.max(m,r.id),0)+1;d.revenues.push({...v,id,cancelled:false});}
 }else if(action==='removeRevenue'){const r=d.revenues.find(r=>r.id===p&&!r.cancelled);if(!r)throw Error('Recette introuvable.');r.cancelled=true;}
 else throw Error('Action inconnue.');renumber(d);d.revision++;return validate(d);
}
export function visible(d){return d.expenses.filter(r=>!r.cancelled).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);}
export function visibleRevenues(d){return d.revenues.filter(r=>!r.cancelled).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);}
