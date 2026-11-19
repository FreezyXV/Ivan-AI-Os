import {fetchPublic,extractPublicPage} from './research-web.js';
import {sealRadarEvidence,validateRadarDrafts,validateRadarReview,radarSourceProfile,radarEvidenceForCards} from './radar-brief.js';
import {createNativeRadar} from './radar-native.js';
import {researchSpans} from './research-contract.js';
import {readInstitutionalSnapshot} from './context.js';
export function radarPassages(text,title){
 if(text.length<=6000)return text;
 const words=[...new Set(title.toLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu)??[])],spans=researchSpans(text);
 const scored=spans.map((text,index)=>({text,index,score:words.filter(w=>text.toLowerCase().includes(w)).length})).sort((a,b)=>b.score-a.score||a.index-b.index);
 const selected=new Set([0,1,...scored.slice(0,10).map(r=>r.index)]);
 return spans.filter((_,i)=>selected.has(i)).join('\n').slice(0,6000);
}
export async function prepareRadarCards({store,rows,settings,complete=createNativeRadar({binary:settings.openclawBinary}),fetchImpl=fetchPublic}){
 const limits={dailyLimit:settings.research.dailyModelLimit??12,reservedForRequests:settings.research.reservedForRequests??0};
 const result={nativeCalls:0,read:0,errors:[]};
 if(!store.hasModelCapacity({...limits,count:2}))return {...result,state:'waiting-model-budget'};
 const job=store.radar.beginPreparation(rows.map(r=>r.id));if(!job)return {...result,state:'already-preparing'};
 const retry=new Set();
 try{
  const sources=[];
  for(const row of rows)try{
   radarSourceProfile(row.item.url,row.item.topic);
   const page=readInstitutionalSnapshot(row.item)??extractPublicPage(await fetchImpl(row.item.url,{maxRedirects:2,maxBytes:800000,timeoutMs:10000}),{maxTextChars:160000});
   radarSourceProfile(page.url,row.item.topic);
   // Full article is read; only this bounded part is analysed, never its title alone.
   const item={id:row.id,topic:row.item.topic,source:{...page,title:page.title.slice(0,240),text:radarPassages(page.text,row.item.title)}};
   sealRadarEvidence([item]);
   sources.push(item);result.read++;
  }catch(e){
   const code=/^(?:RESEARCH_|PUBLIC_RESEARCH_)[A-Z_]+$/.test(e.code??'')?e.code:'PUBLIC_RESEARCH_UNAVAILABLE';
   result.errors.push({id:row.id,code});
   if(['PUBLIC_RESEARCH_TIMEOUT','PUBLIC_RESEARCH_UNAVAILABLE'].includes(e.code))retry.add(row.id);
  }
  if(!sources.length){store.radar.finishPreparation(job.id,job.owner,{error:'RESEARCH_RADAR_SOURCE_UNAVAILABLE',retry:[...retry]});return {...result,state:'waiting-source'};}
  const evidence=sealRadarEvidence(sources);store.radar.saveEvidence(job.id,job.owner,evidence);
  store.radar.reserveModelCall(job.id,job.owner,'analysis',limits);result.nativeCalls++;
  const cards=validateRadarDrafts(evidence,await complete({evidence,stage:'analysis'}));
  for(const item of evidence.items)if(!cards.some(card=>card.id===item.id)){
   retry.add(item.id);result.errors.push({id:item.id,code:'RESEARCH_RADAR_DRAFT_INVALID'});
  }
  if(!cards.length){store.radar.finishPreparation(job.id,job.owner,{error:'RESEARCH_RADAR_BRIEF_INVALID',retry:[...retry]});return {...result,state:'held',error_code:'RESEARCH_RADAR_BRIEF_INVALID'};}
  store.radar.saveCards(job.id,job.owner,cards);
  const reviewEvidence=radarEvidenceForCards(evidence,cards);
  store.radar.reserveModelCall(job.id,job.owner,'contradiction',limits);result.nativeCalls++;
  const review=validateRadarReview(reviewEvidence,cards,await complete({evidence:reviewEvidence,cards,stage:'contradiction'}));
  store.radar.finishPreparation(job.id,job.owner,{review,retry:[...retry]});return {...result,state:'reviewed',approved:review.items.filter(r=>r.decision==='approve').length};
 }catch(e){
  const code=/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_RADAR_NATIVE_UNAVAILABLE';
  if(['RESEARCH_RADAR_NATIVE_UNAVAILABLE','RESEARCH_RADAR_BRIEF_INVALID','RESEARCH_DAILY_MODEL_LIMIT'].includes(code)){
   for(const item of store.radar.preparation(job.id)?.evidence?.items??[])retry.add(item.id);
  }
  store.radar.finishPreparation(job.id,job.owner,{error:code,retry:[...retry]});
  return {...result,state:'held',error_code:code,...(e.failureStage?{failureStage:e.failureStage}:{})};
 }
}
