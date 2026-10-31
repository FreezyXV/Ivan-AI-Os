import {fetchPublic,extractPublicPage} from './research-web.js';
import {sealRadarEvidence,validateRadarCards,validateRadarReview,radarSourceProfile} from './radar-brief.js';
import {createNativeRadar} from './radar-native.js';
import {researchSpans} from './research-contract.js';
export function radarPassages(text,title){
 if(text.length<=6000)return text;
 const words=[...new Set(title.toLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu)??[])],spans=researchSpans(text);
 const scored=spans.map((text,index)=>({text,index,score:words.filter(w=>text.toLowerCase().includes(w)).length})).sort((a,b)=>b.score-a.score||a.index-b.index);
 const selected=new Set([0,1,...scored.slice(0,10).map(r=>r.index)]);
 return spans.filter((_,i)=>selected.has(i)).join('\n').slice(0,6000);
}
export async function prepareRadarCards({store,rows,settings,complete=createNativeRadar({binary:settings.openclawBinary}),fetchImpl=fetchPublic}){
 const dailyLimit=settings.research.dailyModelLimit??12,result={nativeCalls:0,read:0,errors:[]};
 if(store.summary().modelCallsToday+2>dailyLimit)return {...result,state:'waiting-model-budget'};
 const job=store.radar.beginPreparation(rows.map(r=>r.id));if(!job)return {...result,state:'already-preparing'};
 try{
  const sources=[];
  for(const row of rows)try{
   radarSourceProfile(row.item.url,row.item.topic);
   const response=await fetchImpl(row.item.url,{maxRedirects:2,maxBytes:800000,timeoutMs:10000}),page=extractPublicPage(response,{maxTextChars:160000});radarSourceProfile(page.url,row.item.topic);
   // Full article is read; only this bounded part is analysed, never its title alone.
   sources.push({id:row.id,topic:row.item.topic,source:{...page,title:page.title.slice(0,240),text:radarPassages(page.text,row.item.title)}});result.read++;
  }catch(e){result.errors.push({id:row.id,code:/^(?:RESEARCH_|PUBLIC_RESEARCH_)[A-Z_]+$/.test(e.code??'')?e.code:'PUBLIC_RESEARCH_UNAVAILABLE'});}
  if(!sources.length){store.radar.finishPreparation(job.id,job.owner,{error:'RESEARCH_RADAR_SOURCE_UNAVAILABLE'});return {...result,state:'waiting-source'};}
  const evidence=sealRadarEvidence(sources);store.radar.saveEvidence(job.id,job.owner,evidence);
  store.radar.reserveModelCall(job.id,job.owner,'analysis',{dailyLimit});result.nativeCalls++;
  const cards=validateRadarCards(evidence,await complete({evidence,stage:'analysis'}));store.radar.saveCards(job.id,job.owner,cards);
  store.radar.reserveModelCall(job.id,job.owner,'contradiction',{dailyLimit});result.nativeCalls++;
  const review=validateRadarReview(evidence,cards,await complete({evidence,cards,stage:'contradiction'}));
  store.radar.finishPreparation(job.id,job.owner,{review});return {...result,state:'reviewed',approved:review.items.filter(r=>r.decision==='approve').length};
 }catch(e){const code=/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_RADAR_NATIVE_UNAVAILABLE';store.radar.finishPreparation(job.id,job.owner,{error:code});return {...result,state:'held',error_code:code,...(e.failureStage?{failureStage:e.failureStage}:{})};}
}
