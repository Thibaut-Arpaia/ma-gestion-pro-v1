import {validateReceipts,updateReceipt} from './receipts.mjs';
import {validateBank,bankChange,protectClosures} from './reconciliation.mjs';
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
export function normCategory(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function provisionKind(category){
 const c=normCategory(category);
 if(c.includes('tva')&&(c.includes('reversee')||c.includes('reverse')||c.includes('payee')||c.includes('paiement')))return 'vat';
 if(c.includes('urssaf')&&(c.includes('cotisation')||c.includes('payee')||c.includes('paiement')||c==='urssaf'))return 'urssaf';
 if(c.includes('impot'))return 'tax';
 if(c.includes('virement')&&c.includes('personnel'))return 'personal';
 return null;
}
function revenueParts(r){if(r.category==='Commission immobilière'){const ht=Math.round(r.cents/1.2);return {ht,vat:r.cents-ht};}return {ht:r.cents-r.vat_cents,vat:r.vat_cents};}
export function financeSummary(d,year,asOf=`${year}-12-31`){
 if(!date(asOf))throw Error("Date de calcul invalide.");
 const revenues=(d.revenues||[]).filter(r=>!r.cancelled&&r.day.slice(0,4)===String(year)&&r.day<=asOf),expenses=(d.expenses||[]).filter(r=>!r.cancelled&&r.day.slice(0,4)===String(year)&&r.day<=asOf);
 let revenueHt=0,vatCollected=0,vatDeductible=0,vatPaid=0,urssafPaid=0;
 for(const r of revenues){const p=revenueParts(r);revenueHt+=p.ht;vatCollected+=p.vat;}
 for(const r of expenses){const provision=provisionKind(r.category);if(provision){if(provision==='vat')vatPaid+=r.cents;if(provision==='urssaf')urssafPaid+=r.cents;continue;}vatDeductible+=r.vat_cents;}
 const vatNet=Math.max(0,vatCollected-vatDeductible-vatPaid),urssafGenerated=Math.round(revenueHt*.2575),urssafReserve=Math.max(0,urssafGenerated-urssafPaid);
 return {revenueHt,vatCollected,vatDeductible,vatPaid,vatNet,urssafGenerated,urssafPaid,urssafReserve,reserved:vatNet+urssafReserve};
}
export function date(s){const d=new Date(`${s}T12:00:00Z`);return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
export function empty(){return {format:'ma-gestion-pro',version:1,revision:0,setup:null,next:null,expenses:[],revenues:[],preferences:{background:null}};}
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
 validatePreferences(d);
 validateRecurring(d);
 validateReceipts(d.expenses);
 validateBank(d);
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
 else if(action==='restoreReceipt'){
 const row=d.expenses.find(r=>r.id===p.id&&!r.cancelled),index=p.index;
 if(!row||!Number.isInteger(index)||index<0||!row.receiptTrash?.[index])throw Error('Justificatif introuvable.');
 const restored=row.receiptTrash.splice(index,1)[0];if(row.receipt)row.receiptTrash.push(row.receipt);row.receipt=restored;
 }
 else if(action==='saveRecurring'){
 if(!d.setup)throw Error('Enregistre ton point de départ dans Réglages.');
 const category=String(p.category||'').trim(),personal=provisionKind(category)==='personal';const v={label:String(p.label||'').trim(),category,cents:money(p.amount),vat_cents:personal?0:money(p.vat||'0'),payment:p.payment,day:Number(p.day),start:p.start,active:true};
 const old=p.id?d.recurring.find(r=>r.id===Number(p.id)):null;if(p.id&&!old)throw Error('Récurrence introuvable.');
 if(old)Object.assign(old,{...v,active:old.active});else d.recurring.push({...v,id:d.recurring.reduce((max,r)=>Math.max(max,r.id),0)+1,issued:[]});
 }else if(action==='toggleRecurring'){const row=d.recurring.find(r=>r.id===Number(p));if(!row)throw Error('Récurrence introuvable.');row.active=!row.active;}
 else if(action==='issueRecurring'){
 if(!d.setup)throw Error('Enregistre ton point de départ.');const planned=recurringOccurrence(d,Number(p.id),p.month);
 if(d.expenses.some(r=>!r.cancelled&&r.day===planned.day&&r.cents===planned.cents&&normCategory(r.label)===normCategory(planned.label)))throw Error('Une dépense identique existe déjà. Vérifie-la avant de générer cette échéance.');
 const id=d.expenses.reduce((max,r)=>Math.max(max,r.id),0)+1;d.expenses.push({...planned,id,ref:null,historical:false,cancelled:false,notes:'Échéance mensuelle générée',recurringId:Number(p.id),recurringMonth:p.month,receiptExempt:provisionKind(planned.category)==='personal'});
 d.recurring.find(r=>r.id===Number(p.id)).issued.push(p.month);
 }
 else if(['clearBank','closeBank','reopenBank'].includes(action))bankChange(d,action,p,money);
 else if(action==='saveBackground')d.preferences.background=validateBackground(p);
 else if(action==='resetBackground')d.preferences.background=null;
 else throw Error('Action inconnue.');
 if(action==='save'){const row=p.id?d.expenses.find(r=>r.id===p.id):d.expenses.at(-1);updateReceipt(row,p);}
 if(action==='save'||action==='saveRevenue'){const collection=action==='save'?'expenses':'revenues';if(p.id){const old=source[collection].find(r=>r.id===p.id),row=d[collection].find(r=>r.id===p.id);if(old&&(old.cents!==row.cents||old.day!==row.day))delete row.clearedDay;}}
 protectClosures(source,d);renumber(d);d.revision++;return validate(d);
}
export function visible(d){return d.expenses.filter(r=>!r.cancelled).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);}
export function visibleRevenues(d){return d.revenues.filter(r=>!r.cancelled).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);}

// Une alerte reste informative : deux opérations identiques peuvent être légitimes.
export function duplicateCandidates(rows,input){
 const cents=money(input.amount),label=normCategory(input.label);
 if(!date(input.day)||!label||cents<=0)return [];
 return (rows||[]).filter(r=>!r.cancelled&&r.id!==Number(input.id)&&r.day===input.day&&r.cents===cents&&normCategory(r.label)===label);
}

export function duplicateGroups(rows){
 const groups=new Map();
 for(const row of rows||[]){if(row.cancelled)continue;const key=JSON.stringify([row.day,row.cents,normCategory(row.label)]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
 return [...groups.values()].filter(group=>group.length>1);
}

export function pendingBankControls(rows,asOf){
 if(!date(asOf))throw Error('Date de contrôle invalide.');
 return (rows||[]).filter(row=>row.day<=asOf&&!row.clearedDay);
}

export function periodReport(d,year,month=0){
 if(!Number.isInteger(year)||year<1900||year>9999||!Number.isInteger(month)||month<0||month>12)throw new Error('Période invalide.');
 const prefix=String(year)+(month?'-'+String(month).padStart(2,'0'):'');
 const expenses=(d.expenses||[]).filter(r=>!r.cancelled&&r.day.startsWith(prefix));
 const revenues=(d.revenues||[]).filter(r=>!r.cancelled&&r.day.startsWith(prefix));
 const income=revenues.reduce((s,r)=>s+r.cents,0),outgoings=expenses.reduce((s,r)=>s+r.cents,0);
 const monthly=Array.from({length:12},(_,i)=>{const key=String(year)+'-'+String(i+1).padStart(2,'0');const incoming=revenues.filter(r=>r.day.startsWith(key)).reduce((s,r)=>s+r.cents,0),outgoing=expenses.filter(r=>r.day.startsWith(key)).reduce((s,r)=>s+r.cents,0);return {month:i+1,income:incoming,outgoings:outgoing,cashflow:incoming-outgoing};});
 const end=month?lastDay(year,month):`${year}-12-31`;
 return {income,outgoings,cashflow:income-outgoings,expenses,revenues,monthly,fiscal:fiscalPeriod(revenues,expenses),envelope:financeSummary(d,year,end)};
}

function lastDay(year,month){return `${year}-${String(month).padStart(2,'0')}-${String(new Date(Date.UTC(year,month,0)).getUTCDate()).padStart(2,'0')}`;}

function fiscalPeriod(revenues,expenses){
 let revenueHt=0,vatCollected=0,vatDeductible=0,vatPaid=0,urssafPaid=0;
 for(const r of revenues){const p=revenueParts(r);revenueHt+=p.ht;vatCollected+=p.vat;}
 for(const r of expenses){const provision=provisionKind(r.category);if(provision){if(provision==='vat')vatPaid+=r.cents;if(provision==='urssaf')urssafPaid+=r.cents;continue;}vatDeductible+=r.vat_cents;}
 const vatNet=Math.max(0,vatCollected-vatDeductible-vatPaid),urssafGenerated=Math.round(revenueHt*.2575),urssafReserve=Math.max(0,urssafGenerated-urssafPaid);
 return {revenueHt,vatCollected,vatDeductible,vatPaid,vatNet,urssafGenerated,urssafPaid,urssafReserve,reserved:vatNet+urssafReserve};
}

function validMonth(value){return typeof value==='string'&&/^\d{4}-\d{2}$/.test(value)&&date(value+'-01');}
function validatePreferences(d){
 if(d.preferences===undefined)d.preferences={background:null};
 if(!d.preferences||typeof d.preferences!=='object'||Array.isArray(d.preferences))throw Error('Préférences invalides.');
 d.preferences={background:validateBackground(d.preferences.background)};
}
function validateBackground(value){
 if(value===null||value===undefined)return null;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Fond d’écran invalide.');
 const {name,type,size,data,path}=value;
 if(typeof name!=='string'||!name.trim()||name.length>180)throw Error('Nom du fond d’écran invalide.');
 if(!['image/jpeg','image/png','image/webp'].includes(type))throw Error('Format de fond d’écran non pris en charge.');
 if(!Number.isSafeInteger(size)||size<=0||size>3000000)throw Error('Fond d’écran trop volumineux : 3 Mo maximum.');
 if(data!==undefined&&(typeof data!=='string'||!data||data.length>4500000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data)))throw Error('Données du fond d’écran invalides.');
 if(path!==undefined&&(typeof path!=='string'||!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(path)))throw Error('Chemin du fond d’écran invalide.');
 if(data===undefined&&path===undefined)throw Error('Données du fond d’écran invalides.');
 const clean={name:name.trim(),type,size};
 if(data!==undefined)clean.data=data;
 if(path!==undefined)clean.path=path;
 return clean;
}
function validateRecurring(d){
 if(d.recurring===undefined)d.recurring=[];
 if(!Array.isArray(d.recurring))throw Error('Récurrences invalides.');const ids=new Set();
 for(const r of d.recurring){if(!r||!Number.isSafeInteger(r.id)||r.id<1||ids.has(r.id)||typeof r.label!=='string'||!r.label.trim()||r.label.length>200||typeof r.category!=='string'||!r.category.trim()||r.category.length>80||!integer(r.cents)||r.cents<=0||!integer(r.vat_cents)||r.vat_cents<0||r.vat_cents>r.cents||!payments.includes(r.payment)||!Number.isInteger(r.day)||r.day<1||r.day>31||!validMonth(r.start)||typeof r.active!=='boolean'||!Array.isArray(r.issued)||r.issued.some(m=>!validMonth(m))||new Set(r.issued).size!==r.issued.length||(provisionKind(r.category)==='personal'&&r.vat_cents!==0))throw Error('Une récurrence est invalide.');ids.add(r.id);}
}
export function recurringOccurrence(d,id,month){
 const r=(d.recurring||[]).find(r=>r.id===id);if(!r||!r.active)throw Error('Récurrence inactive ou introuvable.');if(!validMonth(month)||month<r.start)throw Error('Mois antérieur au début de la récurrence ou invalide.');if(r.issued.includes(month))throw Error('Cette échéance a déjà été générée, même si la dépense a été supprimée.');
 const [year,m]=month.split('-').map(Number),last=new Date(Date.UTC(year,m,0)).getUTCDate();const day=month+'-'+String(Math.min(r.day,last)).padStart(2,'0');if(!d.setup||day<d.setup.day)throw Error('Échéance antérieure au point de départ.');
 return {day,label:r.label,category:r.category,cents:r.cents,vat_cents:r.vat_cents,payment:r.payment};
}

// Indicateurs du jour ; le bilan des saisies conserve son périmètre complet.
export function dashboardSummary(d,asOf){
 if(!date(asOf))throw Error('Date de calcul invalide.');
 const year=Number(asOf.slice(0,4));
 const expenses=(d.expenses||[]).filter(r=>!r.cancelled&&r.day<=asOf);
 const revenues=(d.revenues||[]).filter(r=>!r.cancelled&&r.day<=asOf);
 const annualExpenses=expenses.filter(r=>r.day.slice(0,4)===String(year));
 const annualRevenues=revenues.filter(r=>r.day.slice(0,4)===String(year));
 const total=annualExpenses.reduce((s,r)=>s+r.cents,0),revenueTotal=annualRevenues.reduce((s,r)=>s+r.cents,0);
 const finance=financeSummary(d,year,asOf);
 const balance=d.setup?d.setup.balance+revenues.reduce((s,r)=>s+r.cents,0)-expenses.filter(r=>!r.historical).reduce((s,r)=>s+r.cents,0):null;
 return {annualExpenses,annualRevenues,total,revenueTotal,cashflow:revenueTotal-total,finance,balance,freeCash:balance===null?null:balance-finance.reserved};
}
