import {provisionKind} from './model.mjs';
export const receiptLimit=5000000;
export function validateReceipt(r){
 if(!r||typeof r.name!=='string'||!r.name.length||r.name.length>255||!['image/jpeg','image/png','application/pdf'].includes(r.type)||!Number.isSafeInteger(r.size)||r.size<=0||r.size>receiptLimit||typeof r.data!=='string'||r.data.length!==4*Math.ceil(r.size/3)||!/^[A-Za-z0-9+/]*={0,2}$/.test(r.data))throw Error('Justificatif invalide (JPEG, PNG ou PDF, 5 Mo maximum).');
 const prefix=r.type==='application/pdf'?'JVBERi0':r.type==='image/png'?'iVBORw0KGgo':'/9j/';
 if(!r.data.startsWith(prefix))throw Error('Le contenu du justificatif ne correspond pas à son format.');
 return r;
}
export function needsReceipt(row){
 return !row.cancelled&&!row.receiptExempt&&!provisionKind(row.category);
}
export function missingReceipts(rows){return rows.filter(r=>needsReceipt(r)&&!r.receipt).length;}
export function validateReceipts(rows){for(const r of rows){if(!r)throw Error('Dépense invalide.');if(r.receipt!==undefined)validateReceipt(r.receipt);if(r.receiptTrash!==undefined){if(!Array.isArray(r.receiptTrash))throw Error('Corbeille de justificatifs invalide.');r.receiptTrash.forEach(validateReceipt);}if(r.receiptExempt!==undefined&&typeof r.receiptExempt!=='boolean')throw Error('Statut justificatif invalide.');}}
export function updateReceipt(row,input){
 if(input.receipt){validateReceipt(input.receipt);if(row.receipt)(row.receiptTrash??=[]).push(row.receipt);row.receipt=input.receipt;}
 if(input.removeReceipt&&row.receipt){(row.receiptTrash??=[]).push(row.receipt);delete row.receipt;}
 if(input.receiptExempt!==undefined)row.receiptExempt=input.receiptExempt===true||input.receiptExempt==='on';
}
