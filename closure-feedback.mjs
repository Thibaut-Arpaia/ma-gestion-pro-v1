// Le retour visuel suit l’écriture réussie et ne participe jamais aux comptes.
export async function saveBankAction(save,action,payload,celebrate){
 await save(action,payload);
 if(action==='closeBank')try{celebrate();}catch{/* Une animation indisponible ne remet pas en cause la clôture. */}
}
export function initClosureFeedback(section){
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
