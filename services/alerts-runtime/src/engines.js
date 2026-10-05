import {collect,privateDir as financeDir,saveSnapshot,snapshots,alerts,judge} from '../../../skills/finance-engine/scripts/veille.mjs';
import {addSignals,privateDir as businessDir,triage} from '../../../skills/business-engine/scripts/signals.mjs';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,appendFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// The ECB retired ICP in February 2026 in favour of HICP. Keep the Claude
// module untouched and adapt its public fetch/result at the runtime boundary.
export const modernFinanceUrl=url=>url.replace('/ICP/','/HICP/').replace('.4.ANR','.4D0.ANR');
export async function collectFinance(fetchImpl=fetch,now=new Date()){
 const result=await collect(async(url,opts)=>{
  const response=await fetchImpl(modernFinanceUrl(url),opts);
  if(!response.ok)return response;
  const raw=await response.text();if(raw.length>1000000)throw Error('FINANCE_RESPONSE_TOO_LARGE');
  if(url.includes('api.kraken.com')){
   const value=JSON.parse(raw);
   // Kraken's final OHLC row is still forming: do not call it a close.
   for(const [key,rows] of Object.entries(value.result??{}))if(key!=='last'&&Array.isArray(rows))rows.pop();
   return {ok:true,text:async()=>JSON.stringify(value)};
  }
  return {ok:true,text:async()=>raw};
 },now);
 result.indicateurs=result.indicateurs.map(i=>({...i,source:modernFinanceUrl(i.source)}));return result;
}
export function observationUrl(indicator){
 const u=new URL(indicator.source);
 if(u.hostname==='data-api.ecb.europa.eu'){
  u.searchParams.delete('lastNObservations');u.searchParams.set('startPeriod',indicator.date_obs);u.searchParams.set('endPeriod',indicator.date_obs);
 }else if(u.hostname==='api.kraken.com')u.searchParams.set('since',String(Date.parse(indicator.date_obs+'T00:00:00Z')/1000));
 else {u.searchParams.set('cosd',indicator.date_obs);u.searchParams.set('coed',indicator.date_obs);}
 return u.href;
}
export async function financeCycle({ledger,now=new Date(),directory=financeDir(),collectImpl=collectFinance,judgeImpl=judge}={}){
 const prior=snapshots(directory).filter(s=>s.date<now.toISOString().slice(0,10)).at(-1);
 const current=await collectImpl(fetch,now);saveSnapshot(directory,current);
 const changes=await judgeImpl(alerts(current,prior));let ingested=0;
 for(const alert of changes.filter(a=>a.niveau==='important'&&Number.isFinite(a.jev)&&a.jev>=0.5)){
  const indicator=current.indicateurs.find(i=>i.id===alert.id);if(!indicator)continue;
  const excerpt=`Relevé public du ${current.date}. ${alert.texte} Période observée : ${indicator.date_obs}. Valeur : ${indicator.valeur} ${indicator.unite}.`;
  const r=ledger.ingest({producer:'finance-watch',scope:'public',topic:'finance',url:observationUrl(indicator),
   title:indicator.libelle,publishedAt:current.collecte_le,observedAt:current.collecte_le,readAt:current.collecte_le,sourceStatus:'read',excerpt});
  if(!r.duplicate)ingested++;
 }
 return {indicators:current.indicateurs.length,sourceErrors:current.erreurs,stale:changes.filter(a=>a.texte.includes('dernière donnée')).length,
  thresholdChanges:changes.filter(a=>a.niveau==='important').length,ingested,personal_data:false};
}
export async function businessCycle({ledger,directory=businessDir(),triageImpl=triage,now=new Date()}={}){
 const candidates=[...ledger.list('pending',100),...ledger.list('review',100),...ledger.list('ready',100)]
  .filter(r=>r.item.topic==='business'&&r.item.sourceStatus==='read'&&/^Ask HN:/i.test(r.item.title)).slice(0,4);
 const signals=candidates.map(({item})=>({source:'hacker-news-public',url:item.url,titre:item.title,
  sujet:'demande-'+createHash('sha256').update(item.title).digest('hex').slice(0,20),type:'demande',date:item.publishedAt.slice(0,10),extrait:item.excerpt.slice(0,500),preuve_paiement:false}));
 const added=addSignals(directory,signals,now);
 const existing=new Set((()=>{try{return readFileSync(path.join(directory,'jev.jsonl'),'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l).id);}catch{return [];}})());
 const file=path.join(directory,'signals.jsonl');
 const all=existsSync(file)?readFileSync(file,'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
 const todo=all.filter(s=>!existing.has(s.id)&&signals.some(c=>c.url===s.url)).slice(0,4);
 let triaged=0;
 if(todo.length){
  const staging=mkdtempSync(path.join(directory,'triage-'));
  try{writeFileSync(path.join(staging,'signals.jsonl'),todo.map(s=>JSON.stringify(s)).join('\n')+'\n',{mode:0o600});
   const result=await triageImpl(staging);triaged=result.tries;
   if(triaged)appendFileSync(path.join(directory,'jev.jsonl'),readFileSync(path.join(staging,'jev.jsonl')),{mode:0o600});
  }finally{rmSync(staging,{recursive:true,force:true});}
 }
 return {...added,triaged,readCandidates:candidates.length,opportunity_scores_created:0,payment_evidence_invented:false};
}
