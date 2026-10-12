export function vatFromTtc(cents,rate){
 const n=Number(String(rate).replace(',','.'));
 if(!Number.isSafeInteger(cents)||cents<0||!Number.isFinite(n)||n<0||n>100)throw Error('Montant TTC ou taux de TVA invalide.');
 return cents-Math.round(cents/(1+n/100));
}
export function splitVat(total,rate,extras=[]){
 const lines=extras.map(line=>({cents:line.cents,rate:Number(String(line.rate).replace(',','.'))}));
 for(const line of lines)vatFromTtc(line.cents,line.rate);
 const main=total-lines.reduce((sum,line)=>sum+line.cents,0);
 if(main<0)throw Error('Les montants TTC supplémentaires dépassent le total du ticket.');
 const all=[{cents:main,rate:Number(String(rate).replace(',','.'))},...lines];
 return {lines:all,vat:all.reduce((sum,line)=>sum+vatFromTtc(line.cents,line.rate),0)};
}
