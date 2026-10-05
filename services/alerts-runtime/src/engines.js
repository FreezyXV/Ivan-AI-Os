import {collect,privateDir as financeDir,saveSnapshot,snapshots,alerts,judge} from '../../../skills/finance-engine/scripts/veille.mjs';
import {addSignals,privateDir as businessDir,triage,signalId} from '../../../skills/business-engine/scripts/signals.mjs';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,appendFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// The ECB retired ICP in February 2026 in favour of HICP. Keep the Claude
// module untouched and adapt its public fetch/result at the runtime boundary.
export const modernFinanceUrl=url=>url.replace('/ICP/','/HICP/').replace('.4.ANR','.4D0.ANR');
export async function collectFinance(fetchImpl=fetch,now=new Date()){
 let ecbSlots=0;const waiting=[];
 const limited=async fn=>{
  if(ecbSlots<2)ecbSlots++;else await new Promise(resolve=>waiting.push(resolve));
  try{return await fn();}finally{if(waiting.length)waiting.shift()();else ecbSlots--;}
 };
 const result=await collect(async(url,opts)=>{
  const fetchSource=async()=>{
   for(let attempt=0;attempt<2;attempt++)try{
    // The legacy collector starts its timeout before waiting. Start this bounded
    // request deadline after obtaining an ECB slot, including on the one retry.
    const response=await fetchImpl(modernFinanceUrl(url),{...opts,signal:AbortSignal.timeout(15000)});
    if(!response.ok){if(attempt===0&&[502,503,504].includes(response.status))continue;return response;}
    const raw=await response.text();if(raw.length>1000000)throw Error('FINANCE_RESPONSE_TOO_LARGE');
    // The integrated Finance parser owns committed-candle selection. Dropping
    // a row here too would lose the last real close when `last` is absent/zero.
    return {ok:true,text:async()=>raw};
   }catch(error){
    const transient=error.name==='TimeoutError'||['ETIMEDOUT','ECONNRESET','EAI_AGAIN'].includes(error.cause?.code);
    if(attempt===1||!transient)throw error;
   }
  };
  return url.includes('data-api.ecb.europa.eu')?limited(fetchSource):fetchSource();
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
export async function financeCycle({ledger,now=new Date(),directory=financeDir(),collectImpl=collectFinance,judgeImpl=judge,useJev=true}={}){
 const prior=snapshots(directory).filter(s=>s.date<now.toISOString().slice(0,10)).at(-1);
 const current=await collectImpl(fetch,now);saveSnapshot(directory,current);
 const observations=alerts(current,prior),important=observations.filter(a=>a.niveau==='important');
 let changes=observations;if(useJev)try{changes=await judgeImpl(observations.map(a=>({...a})));}catch{changes=observations;}
 const decisions=new Map(changes.map(a=>[a.id,a]));
 const pendingDecisions=useJev?important.filter(a=>!Number.isFinite(decisions.get(a.id)?.jev)).length:0;
 const before=new Map((prior?.indicateurs??[]).map(i=>[i.id,i]));
 const staleIds=new Set(observations.filter(a=>a.texte.includes('dernière donnée')).map(a=>a.id));
 const macroIds=new Set(['inflation_zone_euro','inflation_sous_jacente','us_10_ans']);
 const candidates=observations.filter(a=>{
  if(staleIds.has(a.id))return false;
  if(a.niveau==='important')return !Number.isFinite(decisions.get(a.id)?.jev)||decisions.get(a.id).jev>=0.5;
  const i=current.indicateurs.find(i=>i.id===a.id),old=before.get(a.id);
  return macroIds.has(a.id)&&old&&i&&old.valeur!==i.valeur&&old.date_obs!==i.date_obs;
 });
 let ingested=0;
 for(const alert of candidates){
  const indicator=current.indicateurs.find(i=>i.id===alert.id);if(!indicator)continue;
  const excerpt=`Relevé public du ${current.date}. ${alert.texte} Période observée : ${indicator.date_obs}. Valeur : ${indicator.valeur} ${indicator.unite}.`;
  const r=ledger.ingest({producer:'finance-watch',scope:'public',topic:'finance',url:observationUrl(indicator),
   title:indicator.libelle,publishedAt:current.collecte_le,observedAt:current.collecte_le,readAt:current.collecte_le,sourceStatus:'read',excerpt});
  if(!r.duplicate)ingested++;
 }
 return {indicators:current.indicateurs.length,sourceErrors:current.erreurs,stale:staleIds.size,
  thresholdChanges:important.length,macroCandidates:candidates.filter(a=>macroIds.has(a.id)).length,
  pendingDecisions,decisionErrors:pendingDecisions,classificationMode:useJev?'jev-advisory':'deterministic-observations',ingested,personal_data:false};
}
const jsonLines=file=>existsSync(file)?readFileSync(file,'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
function pendingBusinessCandidates(ledger,directory){
 const existing=new Set(jsonLines(path.join(directory,'jev.jsonl')).map(l=>l.id));
 return [...ledger.list('pending',100),...ledger.list('review',100),...ledger.list('ready',100)]
  .filter(r=>r.item.topic==='business'&&r.item.sourceStatus==='read'&&/^Ask HN:/i.test(r.item.title)&&
   !existing.has(signalId(r.item))).slice(0,4);
}
// The coordinator may reserve one additional current-week evidence slot after
// the base slot. Never use a changing candidate hash as an unlimited schedule.
export const businessHasPendingEvidence=(ledger,directory=businessDir())=>pendingBusinessCandidates(ledger,directory).length>0;
export async function businessCycle({ledger,directory=businessDir(),triageImpl=triage,now=new Date(),useJev=true}={}){
 const candidates=pendingBusinessCandidates(ledger,directory);
 const signals=candidates.map(({item})=>({source:'hacker-news-public',url:item.url,titre:item.title,
  sujet:'demande-'+createHash('sha256').update(item.title).digest('hex').slice(0,20),type:'demande',date:item.publishedAt.slice(0,10),extrait:item.excerpt.slice(0,500),preuve_paiement:false}));
 const added=addSignals(directory,signals,now);
 const existing=new Set(jsonLines(path.join(directory,'jev.jsonl')).map(l=>l.id));
 const file=path.join(directory,'signals.jsonl');
 const all=existsSync(file)?readFileSync(file,'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
 const todo=all.filter(s=>!existing.has(s.id)&&signals.some(c=>c.url===s.url)).slice(0,4);
 let triaged=0,pendingDecisions=0;
 if(todo.length&&useJev){
  const staging=mkdtempSync(path.join(directory,'triage-'));
  try{writeFileSync(path.join(staging,'signals.jsonl'),todo.map(s=>JSON.stringify(s)).join('\n')+'\n',{mode:0o600});
   const result=await triageImpl(staging);triaged=result.tries;
   pendingDecisions=Number.isInteger(result.en_attente_jev)?result.en_attente_jev:Math.max(0,todo.length-triaged);
   if(triaged)appendFileSync(path.join(directory,'jev.jsonl'),readFileSync(path.join(staging,'jev.jsonl')),{mode:0o600});
  }finally{rmSync(staging,{recursive:true,force:true});}
 }
 return {...added,triaged,pendingDecisions,decisionErrors:pendingDecisions,classificationMode:useJev?'jev-advisory':'native-editorial-queue',
  pendingEditorial:useJev?0:todo.length,readCandidates:candidates.length,opportunity_scores_created:0,payment_evidence_invented:false};
}
