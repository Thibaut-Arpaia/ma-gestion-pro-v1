const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function bankRows(d){return [...(d.expenses||[]).filter(r=>!r.cancelled&&!r.historical).map(r=>({...r,kind:'expense',signed:-r.cents})),...(d.revenues||[]).filter(r=>!r.cancelled).map(r=>({...r,kind:'revenue',signed:r.cents}))].sort((a,b)=>a.day.localeCompare(b.day)||a.kind.localeCompare(b.kind)||a.id-b.id);}
export function bankSummary(d,end){
 if(!validDay(end)||!d.setup||end<d.setup.day)throw Error('La date de rapprochement doit être postérieure ou égale au point de départ.');
 const rows=bankRows(d),cleared=rows.filter(r=>r.clearedDay&&r.clearedDay<=end),pending=rows.filter(r=>r.day<=end&&!r.clearedDay);
 return {expected:d.setup.balance+cleared.reduce((sum,r)=>sum+r.signed,0),pending:pending.length,cleared:cleared.length};
}
function fingerprint(d,end){return JSON.stringify({setup:d.setup,rows:bankRows(d).filter(r=>(r.clearedDay&&r.clearedDay<=end)||r.day<=end).map(r=>({kind:r.kind,id:r.id,day:r.day,cents:r.cents,clearedDay:r.clearedDay||null})).sort((a,b)=>a.kind.localeCompare(b.kind)||a.id-b.id)});}
export function validateBank(d){
 for(const r of [...d.expenses,...(d.revenues||[])])if(r.clearedDay!==undefined&&(!validDay(r.clearedDay)||!d.setup||r.clearedDay<d.setup.day||r.historical))throw Error('Date de pointage invalide.');
 if(d.bankClosures!==undefined){if(!Array.isArray(d.bankClosures))throw Error('Clôtures invalides.');let previous='';for(const c of d.bankClosures){if(!c||!validDay(c.end)||c.end<=previous||!Number.isSafeInteger(c.bankBalance)||c.bankBalance!==c.expected||typeof c.closedAt!=='string'||!Number.isFinite(Date.parse(c.closedAt))||c.fingerprint!==fingerprint(d,c.end))throw Error('Une clôture bancaire est incohérente.');const summary=bankSummary(d,c.end);if(summary.expected!==c.expected||summary.pending)throw Error('Solde de clôture bancaire incohérent.');previous=c.end;}}
}
export function bankChange(d,action,p,money){
 if(!d.setup)throw Error('Enregistre le point de départ avant le rapprochement.');
 if(action==='clearBank'){
 const rows=p.kind==='expense'?d.expenses:p.kind==='revenue'?d.revenues:null;
 const row=rows?.find(r=>r.id===p.id&&!r.cancelled&&!r.historical);if(!row)throw Error('Opération introuvable.');
 if(p.cleared===false)delete row.clearedDay;else{if(!validDay(p.day)||p.day<d.setup.day)throw Error('Date réelle de débit ou crédit invalide.');row.clearedDay=p.day;}
 }else if(action==='closeBank'){
 const summary=bankSummary(d,p.end),bankBalance=money(p.balance);
 if((d.bankClosures||[]).some(c=>c.end>=p.end))throw Error('Cette période est déjà clôturée ou précède une clôture.');
 if(summary.pending)throw Error('Pointe les opérations en attente avant la clôture.');
 if(bankBalance!==summary.expected)throw Error('La clôture nécessite un écart de 0,00 €.');
 (d.bankClosures??=[]).push({end:p.end,bankBalance,expected:summary.expected,closedAt:new Date().toISOString(),fingerprint:fingerprint(d,p.end)});
 }else if(action==='reopenBank'){
 if(!d.bankClosures?.length)throw Error('Aucune clôture à rouvrir.');d.bankClosures.pop();
 }
}
export function protectClosures(before,after){for(const c of before.bankClosures||[])if(after.bankClosures?.some(x=>x.end===c.end)&&c.fingerprint!==fingerprint(after,c.end))throw Error('Cette modification touche une période clôturée. Rouvre la clôture dans Rapprochement.');}
