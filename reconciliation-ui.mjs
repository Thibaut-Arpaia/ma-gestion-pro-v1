import {bankRows,bankSummary} from './reconciliation.mjs';
export function initReconciliation({getState,save,notify,fmt,today}){
 const nav=document.createElement('button');nav.dataset.view='bank';nav.textContent='Rapprochement';document.querySelector('nav').insertBefore(nav,document.querySelector('nav [data-view=calculator]'));
 const section=document.createElement('section');section.id='bank';section.className='view content page';section.hidden=true;
 section.innerHTML='<div class="page-heading"><h1>Rapprochement bancaire</h1></div><div class="bank-filters"><label>Mois<input id="bank-month" type="month"></label><label>Du<input id="bank-from" type="date"></label><label>Au<input id="bank-end" type="date"></label><label>Opérations<select id="bank-kind"><option value="all">Toutes</option><option value="revenue">Entrées</option><option value="expense">Sorties</option></select></label><label>Pointage<select id="bank-status"><option value="all">Toutes</option><option value="pending">À pointer</option><option value="cleared">Pointées</option></select></label></div><div class="bank-summary"><div><h2>Solde initial + opérations pointées au <span id="bank-cutoff"></span></h2><strong id="bank-expected">—</strong></div><label>Solde bancaire réel à cette date (€)<input id="bank-balance" inputmode="decimal" placeholder="Solde du relevé"></label><div><h2>Écart (banque − solde pointé)</h2><strong id="bank-difference">—</strong></div></div><p id="bank-pending" role="status"></p><div class="bank-table-wrap"><table class="bank-table"><thead><tr><th>Date saisie</th><th>Opération</th><th>Entrée / sortie</th><th>Date réelle banque</th><th>Pointée</th></tr></thead><tbody id="bank-rows"></tbody></table></div><div class="form-actions"><button id="bank-close" class="primary" type="button">Clôturer la période</button><button id="bank-reopen" type="button" hidden>Rouvrir la dernière clôture</button></div><p id="bank-closed" class="path"></p>';
 document.querySelector('main').append(section);
 const celebrate=initClosureFeedback(section);
 const $=id=>section.querySelector(id),end=$('#bank-end'),from=$('#bank-from'),balance=$('#bank-balance');
 end.value=today();from.value=today().slice(0,7)+'-01';$('#bank-month').value=today().slice(0,7);
 function selectMonth(){const month=$('#bank-month').value;if(!/^\d{4}-\d{2}$/.test(month))return;const [y,m]=month.split('-').map(Number);from.value=month+'-01';const last=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);end.value=last>today()?today():last;balance.value='';render();}
 $('#bank-month').addEventListener('change',selectMonth);
 for(const id of ['#bank-from','#bank-end','#bank-kind','#bank-status'])$(id).addEventListener('change',render);
 balance.addEventListener('input',renderSummary);
 let busy=false;
 async function mutate(action,p){if(busy)return;busy=true;render();try{await saveBankAction(save,action,p,celebrate);notify(action==='closeBank'?'Période clôturée.':action==='reopenBank'?'Dernière clôture rouverte.':'Pointage enregistré.');}catch(e){notify(e.message,true);}finally{busy=false;render();}}
 $('#bank-close').onclick=()=>{if(window.confirm('Clôturer les opérations jusqu’au '+end.value+' ? Les montants et pointages seront verrouillés.'))mutate('closeBank',{end:end.value,balance:balance.value});};
 $('#bank-reopen').onclick=()=>{if(window.confirm('Rouvrir la dernière clôture pour modifier cette période ?'))mutate('reopenBank',{});};
 function renderSummary(){const d=getState();const button=$('#bank-close');button.disabled=true;$('#bank-reopen').hidden=!d?.bankClosures?.length;$('#bank-reopen').disabled=busy;
 const closures=d?.bankClosures||[];$('#bank-closed').textContent=closures.length?'Dernière clôture : '+closures.at(-1).end+' · '+fmt.format(closures.at(-1).bankBalance/100):'Aucune période clôturée.';
 if(!d?.setup){$('#bank-expected').textContent='—';$('#bank-difference').textContent='—';$('#bank-pending').textContent='Ouvre ton dossier et configure son point de départ.';return;}
 try{const summary=bankSummary(d,end.value);$('#bank-cutoff').textContent=end.value.split('-').reverse().join('/');$('#bank-expected').textContent=fmt.format(summary.expected/100);$('#bank-pending').textContent=summary.pending+' opération(s) à pointer jusqu’à cette date, y compris les mois précédents.';
 const raw=balance.value.replace(/[\s\u00a0\u202f]/g,'').replace(',','.');const actual=/^-?\d+(\.\d{1,2})?$/.test(raw)?Math.round(Number(raw)*100):null;
 $('#bank-difference').textContent=actual===null?'—':fmt.format((actual-summary.expected)/100);$('#bank-difference').classList.toggle('bank-match',actual===summary.expected);button.disabled=busy||actual===null||actual!==summary.expected||summary.pending>0||closures.some(c=>c.end>=end.value)||!from.value||from.value>end.value;
 }catch(e){$('#bank-expected').textContent='—';$('#bank-difference').textContent='—';$('#bank-pending').textContent=e.message;}}
 function render(){renderSummary();const host=$('#bank-rows');host.replaceChildren();const d=getState();if(!d?.setup)return;
 const cutoff=d.bankClosures?.at(-1)?.end,kind=$('#bank-kind').value,status=$('#bank-status').value;
 const rows=bankRows(d).filter(r=>r.day>=from.value&&r.day<=end.value&&(kind==='all'||r.kind===kind)&&(status==='all'||(status==='pending'?!r.clearedDay:!!r.clearedDay)));
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='Aucune opération pour ces filtres.';tr.append(td);host.append(tr);return;}
 rows.forEach(r=>{const tr=document.createElement('tr');const day=document.createElement('td'),label=document.createElement('td'),amount=document.createElement('td'),dateCell=document.createElement('td'),checkCell=document.createElement('td');day.textContent=r.day.split('-').reverse().join('/');label.textContent=r.label+' · '+r.category;amount.textContent=(r.kind==='revenue'?'+':'−')+fmt.format(r.cents/100);amount.className=r.kind==='revenue'?'bank-income':'bank-expense';const input=document.createElement('input');input.type='date';input.value=r.clearedDay||(r.day<d.setup.day?d.setup.day:r.day);input.min=d.setup.day;input.setAttribute('aria-label','Date banque : '+r.label);const check=document.createElement('input');check.type='checkbox';check.checked=!!r.clearedDay;check.setAttribute('aria-label','Pointer : '+r.label);const locked=cutoff&&(r.day<=cutoff||(r.clearedDay&&r.clearedDay<=cutoff));input.disabled=check.disabled=busy||!!locked;
 check.onchange=()=>mutate('clearBank',{kind:r.kind,id:r.id,cleared:check.checked,day:input.value});input.onchange=()=>{if(r.clearedDay)mutate('clearBank',{kind:r.kind,id:r.id,day:input.value});};dateCell.append(input);checkCell.append(check);tr.append(day,label,amount,dateCell,checkCell);host.append(tr);});
 }
 return {render,reset(){balance.value='';$('#bank-month').value=today().slice(0,7);selectMonth();}};
}

// Le retour visuel suit l’écriture réussie et ne participe jamais aux comptes.
export async function saveBankAction(save,action,payload,celebrate){
 await save(action,payload);
 if(action==='closeBank')try{celebrate();}catch{/* Une animation indisponible ne remet pas en cause la clôture. */}
}
function initClosureFeedback(section){
 const key='ma-gestion-pro-closure-animation';
 const label=document.createElement('label');label.className='closure-option';
 const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=true;
 try{checkbox.checked=localStorage.getItem(key)!=='off';}catch{}
 label.append(checkbox,document.createTextNode('Confettis à la clôture'));
 section.querySelector('.form-actions').append(label);
 checkbox.addEventListener('change',()=>{try{localStorage.setItem(key,checkbox.checked?'on':'off');}catch{}});
 let stop=()=>{};
 return ()=>{
 stop();if(!checkbox.checked||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const canvas=document.createElement('canvas');canvas.className='closure-confetti';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
 const width=window.innerWidth,height=window.innerHeight;canvas.width=width;canvas.height=height;
 const colors=['#00d6e9','#ff6933','#ff5aab','#fff0c2'];
 const particles=Array.from({length:90},()=>({x:Math.random()*width,y:-Math.random()*height,velocity:70+Math.random()*100,sway:Math.random()*Math.PI*2,size:4+Math.random()*5,color:colors[Math.floor(Math.random()*colors.length)]}));
 let frame,start=null,previous=null,done=false;
 const hide=()=>{if(document.hidden)stop();};
 stop=()=>{if(done)return;done=true;cancelAnimationFrame(frame);canvas.remove();document.removeEventListener('visibilitychange',hide);};
 document.addEventListener('visibilitychange',hide);
 function draw(now){if(done)return;start??=now;previous??=now;const dt=Math.min((now-previous)/1000,.05);previous=now;if(now-start>=5000){stop();return;}
 ctx.clearRect(0,0,width,height);ctx.globalAlpha=Math.min(1,(5000-(now-start))/900);
 for(const p of particles){p.y+=p.velocity*dt;p.sway+=dt*2;ctx.fillStyle=p.color;ctx.fillRect(p.x+Math.sin(p.sway)*20,p.y,p.size,p.size*1.7);}
 frame=requestAnimationFrame(draw);
 }
 frame=requestAnimationFrame(draw);
 };
}
