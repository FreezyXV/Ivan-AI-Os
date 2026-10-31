import {openResearchStore} from './research-store.js';import {PILOT_CONTEXT,validateItem,suspiciousSource} from './context.js';
import {createTelegramDelivery} from './telegram-delivery.js';import {researchFail} from './research-contract.js';
import {projectRadarPage} from '../../../shared/radar-memory.mjs';
import {renderRadarCard,radarSourceProfile} from './radar-brief.js';
import {prepareRadarCards} from './radar-prepare.js';
const domains=['business','finance','engineering','system'];
const words=s=>new Set(s.toLowerCase().match(/[\p{L}][\p{L}\p{N}-]{4,}/gu)??[]);
export function chooseRadarTopics(rows,feedback,limit){
 const score=row=>feedback.reduce((n,f)=>{const sign=f.verdict==='inutile'?-1:1,vocab=words(f.item.title),overlap=[...words(row.item.title)].filter(w=>vocab.has(w)).length;
  return n+sign*((row.item.topic===f.item.topic?.toLowerCase()?0.25:0)+Math.min(2,overlap)*0.3);},0);
 const recent=(a,b)=>Date.parse(b.item.publishedAt)-Date.parse(a.item.publishedAt)||a.id.localeCompare(b.id);
 const fresh=[...rows].sort(recent),chosen=[],add=r=>{if(r&&!chosen.some(x=>x.id===r.id)&&chosen.length<limit)chosen.push(r);};
 // At least one per represented domain, then 25% exploration. Preferences rank,
 // never permanently suppress a domain on the strength of a few ratings.
 for(const domain of domains)add(fresh.find(r=>r.item.topic===domain));
 for(const row of fresh){if(chosen.length>=Math.max(domains.length,Math.ceil(limit/4)))break;add(row);}
 while(chosen.length<Math.min(limit,rows.length)){
  const priority=r=>score(r)-chosen.filter(x=>x.item.topic===r.item.topic).length*(r.item.topic==='system'?1.2:0.4);
  add(rows.filter(r=>!chosen.some(x=>x.id===r.id)).sort((a,b)=>priority(b)-priority(a)||recent(a,b))[0]);
 }
 return chosen;
}
export function renderRadarPage(rows,{day}){
 if(!rows.length||rows.length>2)researchFail('RESEARCH_RADAR_BRIEF_INVALID');
 return [`Pistes expliquées — à toi de juger · ${day}`,...rows.map(row=>{const x=row.explanation;if(!x)researchFail('RESEARCH_RADAR_BRIEF_REQUIRED');return renderRadarCard(x.evidence,x.card,x.review,x.cards);})].join('\n\n────────────────\n\n');
}
export async function radarTick({settings,ledger,store,now=new Date(),force=false,deliver=createTelegramDelivery({binary:settings?.openclawBinary,target:settings?.target}),maxPages=2,prepare=prepareRadarCards,complete,fetchImpl}={}){
 if(settings?.radar?.enabled!==true)return {state:'disabled'};
 const limit=settings.radar.dailyTopics??20;
 if(!Number.isInteger(limit)||limit<1||limit>40||!Number.isInteger(maxPages)||maxPages<1||maxPages>8)researchFail('RESEARCH_RADAR_CONFIG_INVALID');
 const owns=!store;store??=openResearchStore(settings.research.directory);
 const result={topics:0,delivered:0,unknown:0,nativeCalls:0};
 const snapshot=()=>{const summary=store.radar.summary();return {...result,...summary,nativeCalls:result.nativeCalls,nativeCallsTotal:summary.nativeCalls,unknown:result.unknown,unknownPages:summary.unknown,state:result.unknown?'delivery_unknown':result.delivered?'delivered':'empty'};};
 try{
  store.radar.reconcile();const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(now));
  const allowance=force||hour>=18?limit:hour>=9?Math.ceil(limit/2):0;
  if(!allowance)return snapshot();
  const eligible=new Set();
  for(const row of ledger.radarSources()){
   try{const item=validateItem(row.item);
    if(!PILOT_CONTEXT.active.includes(item.topic)||['delivered','delivery_unknown','sending'].includes(row.state)||item.url.length>400||now-Date.parse(item.publishedAt)>30*86400000||Date.parse(item.publishedAt)>now.getTime()+300000||Date.parse(item.observedAt)>now.getTime()+300000||
     suspiciousSource(item.title+' '+item.excerpt)||/apikey_|Bearer\s|-----BEGIN|\b(?:sk-|gh[pousr]_)[\w-]{16,}/i.test(item.title+' '+item.excerpt+' '+item.url))continue;
    radarSourceProfile(item.url,item.topic);eligible.add(store.radar.register(item));
   }catch{/* malformed/private inputs are never sent */}
  }
  const remaining=Math.max(0,allowance-store.radar.summary().topicsToday);
  if(remaining&&store.radar.explained().filter(r=>eligible.has(r.id)).length<Math.min(remaining,4)){
   const candidates=chooseRadarTopics(store.radar.preparable().filter(r=>eligible.has(r.id)),store.radar.preferences(),Math.min(remaining,4));
   if(candidates.length){result.preparation=await prepare({store,rows:candidates,settings,...(complete?{complete}:{}),...(fetchImpl?{fetchImpl}:{})});result.nativeCalls+=result.preparation.nativeCalls??0;
    if(result.preparation.error_code)result.error_code=result.preparation.error_code;}
  }
  const rows=chooseRadarTopics(store.radar.explained().filter(r=>eligible.has(r.id)),store.radar.preferences(),remaining);
  let offset=0;
  for(let page=0;page<maxPages&&offset<rows.length;page++){
   const batch=[];let text;
   while(batch.length<2&&offset<rows.length){const candidate=rows[offset],next=renderRadarPage([...batch,candidate],{day:new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris'}).format(now)});if(next.length>2500)break;batch.push(candidate);text=next;offset++;}
   if(!batch.length)break;
   const reserved=store.radar.reserve(batch.map(r=>r.id),text,{limit:allowance});if(!reserved)break;
   // Projection failure is explicit and quarantines this attempt, rather than
   // overwriting a note or claiming the catalogue was delivered.
   try{if(settings.opportunities)projectRadarPage(settings.opportunities,{...reserved,rows:batch,at:now.toISOString()});}
   catch{store.radar.finish(reserved.id);result.error_code='RESEARCH_RADAR_MEMORY_FAILED';break;}
   let receipt;try{receipt=await deliver({text});}catch{}
   const done=store.radar.finish(reserved.id,receipt);result.topics+=batch.length;
   result[done.state==='delivered'?'delivered':'unknown']++;
   if(done.state==='unknown'){result.error_code='RESEARCH_RADAR_DELIVERY_UNKNOWN';break;}
  }
  return snapshot();
 }finally{if(owns)store.close();}
}
