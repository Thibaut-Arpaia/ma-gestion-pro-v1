const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const parseCents=value=>{const s=String(value||'').replace(/\u2212/g,'-').replace(/[\s\u00a0\u202f€"]/g,'').replace(',','.');if(!s)return null;if(!/^-?\d+(\.\d{1,2})?$/.test(s))return null;return Math.round(Number(s)*100);};
const addDays=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
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
 }else if(action==='autoClearBank'){
 const matches=autoClearMatches(d,p?.entries||[]);
 if(!matches.length)throw Error('Aucune correspondance bancaire unique à pointer.');
 for(const match of matches){const rows=match.kind==='expense'?d.expenses:d.revenues;const row=rows.find(r=>r.id===match.id);row.clearedDay=match.clearedDay;}
 }
}
export function protectClosures(before,after){for(const c of before.bankClosures||[])if(after.bankClosures?.some(x=>x.end===c.end)&&c.fingerprint!==fingerprint(after,c.end))throw Error('Cette modification touche une période clôturée. Rouvre la clôture dans Rapprochement.');}

export function autoClearMatches(d,entries){
 if(!Array.isArray(entries))throw Error('Import bancaire invalide.');
 const lockedEnd=d.bankClosures?.at(-1)?.end||'';
 const candidates=bankRows(d).filter(r=>!r.clearedDay&&r.day>lockedEnd);
 const used=new Set(),matches=[];
 for(const entry of entries){
  if(!entry||!validDay(entry.day)||!Number.isSafeInteger(entry.cents)||entry.cents===0)throw Error('Une ligne du CSV bancaire est invalide.');
  const possible=candidates.filter(r=>!used.has(r.kind+':'+r.id)&&r.signed===entry.cents&&r.day<=entry.day&&entry.day<=addDays(r.day,10));
  if(possible.length===1){const r=possible[0];used.add(r.kind+':'+r.id);matches.push({kind:r.kind,id:r.id,clearedDay:entry.day,label:r.label,cents:r.signed});}
 }
 return matches;
}

export function parseBankCsv(text){
 const lines=String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 if(lines.length<2)throw Error('CSV bancaire vide ou incomplet.');
 const sep=[';','\t',','].sort((a,b)=>lines[0].split(b).length-lines[0].split(a).length)[0];
 const cells=line=>line.split(sep).map(cell=>cell.trim().replace(/^"|"$/g,''));
 const headers=cells(lines[0]).map(h=>h.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
 const find=(...names)=>headers.findIndex(h=>names.some(name=>h.includes(name)));
 const dateIndex=find('date'),labelIndex=find('libelle','operation','description'),amountIndex=find('montant','amount'),debitIndex=find('debit'),creditIndex=find('credit');
 if(dateIndex<0||(amountIndex<0&&(debitIndex<0||creditIndex<0)))throw Error('Colonnes CSV attendues : date et montant, ou date, débit et crédit.');
 const entries=[];
 for(const line of lines.slice(1)){
  const row=cells(line),rawDate=row[dateIndex];let day=null;
  const iso=rawDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/),fr=rawDate?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(iso)day=rawDate;else if(fr)day=`${fr[3]}-${fr[2].padStart(2,'0')}-${fr[1].padStart(2,'0')}`;
  if(!validDay(day))continue;
  let cents=amountIndex>=0?parseCents(row[amountIndex]):null;
  if(cents===null){const debit=parseCents(row[debitIndex])||0,credit=parseCents(row[creditIndex])||0;cents=credit?Math.abs(credit):-Math.abs(debit);}
  if(cents)entries.push({day,cents,label:labelIndex>=0?row[labelIndex]:''});
 }
 if(!entries.length)throw Error('Aucune ligne bancaire exploitable dans ce CSV.');
 return entries;
}
