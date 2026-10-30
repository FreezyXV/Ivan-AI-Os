import {openResearchStore} from './research-store.js';import {PILOT_CONTEXT,validateItem,suspiciousSource} from './context.js';
import {createTelegramDelivery} from './telegram-delivery.js';import {researchFail} from './research-contract.js';
import {projectRadarPage} from '../../../shared/radar-memory.mjs';
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
 const clean=s=>s.replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim();
 return [`Radar large — à toi de juger · ${day}`,'Sujets repérés, pas recommandations. Les titres restent ceux des sources.',
 ...rows.map(({id,item})=>{const status=item.sourceStatus==='read'?'extrait lu, affirmation de la source':'titre seul — contenu non vérifié',quote=item.sourceStatus==='read'?`\nExtrait : « ${clean(item.excerpt).split(/\s+/).slice(0,16).join(' ').slice(0,115)} […] »`:'';
  return `\n[${id}] ${item.topic}\n${clean(item.title).slice(0,130)}\nPublié ${item.publishedAt.slice(0,10)} · ${status}${quote}\n${item.url}`;}),
 '\n/avis ID utile | inutile | creuser [raison facultative]','Ex. /avis '+rows[0].id+' utile — tu peux aussi me répondre ici dans Codex.'].join('\n');
}
export async function radarTick({settings,ledger,store,now=new Date(),force=false,deliver=createTelegramDelivery({binary:settings?.openclawBinary,target:settings?.target}),maxPages=2}={}){
 if(settings?.radar?.enabled!==true)return {state:'disabled'};
 const limit=settings.radar.dailyTopics??20;
 if(!Number.isInteger(limit)||limit<1||limit>40||!Number.isInteger(maxPages)||maxPages<1||maxPages>8)researchFail('RESEARCH_RADAR_CONFIG_INVALID');
 const owns=!store;store??=openResearchStore(settings.research.directory);
 const result={topics:0,delivered:0,unknown:0,nativeCalls:0};
 const snapshot=()=>{const summary=store.radar.summary();return {...result,...summary,unknown:result.unknown,unknownPages:summary.unknown,state:result.unknown?'delivery_unknown':result.delivered?'delivered':'empty'};};
 try{
  store.radar.reconcile();const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(now));
  const allowance=force||hour>=18?limit:hour>=9?Math.ceil(limit/2):0;
  if(!allowance)return snapshot();
  const eligible=new Set();
  for(const row of ledger.radarSources()){
   try{const item=validateItem(row.item);
    if(!PILOT_CONTEXT.active.includes(item.topic)||['delivered','delivery_unknown','sending'].includes(row.state)||item.url.length>400||now-Date.parse(item.publishedAt)>30*86400000||Date.parse(item.publishedAt)>now.getTime()+300000||Date.parse(item.observedAt)>now.getTime()+300000||
     suspiciousSource(item.title+' '+item.excerpt)||/apikey_|Bearer\s|-----BEGIN|\b(?:sk-|gh[pousr]_)[\w-]{16,}/i.test(item.title+' '+item.excerpt+' '+item.url))continue;
    eligible.add(store.radar.register(item));
   }catch{/* malformed/private inputs are never sent */}
  }
  const remaining=Math.max(0,allowance-store.radar.summary().topicsToday),rows=chooseRadarTopics(store.radar.unseen().filter(r=>eligible.has(r.id)),store.radar.preferences(),remaining);
  let offset=0;
  for(let page=0;page<maxPages&&offset<rows.length;page++){
   const batch=[];let text;
   while(batch.length<5&&offset<rows.length){const candidate=rows[offset],next=renderRadarPage([...batch,candidate],{day:new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris'}).format(now)});if(next.length>2500)break;batch.push(candidate);text=next;offset++;}
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
