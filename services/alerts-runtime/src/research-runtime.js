import {openResearchStore} from './research-store.js';import {discoverResearch,buildResearchBundle} from './research-discovery.js';
import {createNativeResearch} from './research-native.js';import {renderResearchMessage,researchFail,validateResearchAnalysis} from './research-contract.js';
import {openDossiers} from '../../../shared/opportunity-dossier.mjs';import {createTelegramDelivery} from './telegram-delivery.js';
import {parisDay,scheduleSlots} from './schedule.js';
export async function researchTick({settings,ledger,now=new Date(),store,
 discover=discoverResearch,build=buildResearchBundle,complete=createNativeResearch({binary:settings?.openclawBinary}),
 deliver=createTelegramDelivery({binary:settings?.openclawBinary,target:settings?.target}),forceDelivery=false,deliveryOnly=false,jobId}={}){
 if(!settings?.research?.enabled)return {state:'disabled'};
 if(!settings.opportunities||typeof settings.research.directory!=='string')researchFail('RESEARCH_RUNTIME_CONFIG_INVALID');
 const owns=!store;store??=openResearchStore(settings.research.directory);
 const result={nativeCalls:0,delivered:0,deliveryUnknown:0};
 try{
  result.reconciled=store.reconcile();
  const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(now);
  const key=`discovery:${parisDay(now)}:${Math.floor(Number(p)/3)}`;
  if(!deliveryOnly&&!store.discovery(key)){
   result.discovery=await discover({store,ledger,now});store.recordDiscovery(key,result.discovery);
  }
  const dailyLimit=settings.research.dailyModelLimit??12;
  if(!Number.isInteger(dailyLimit)||dailyLimit<2||dailyLimit>60)researchFail('RESEARCH_RUNTIME_CONFIG_INVALID');
  // Leave room for explained radar cards. Explicit user research remains first;
  // background discovery cannot spend the shared daily allowance before 9 a.m.
  const userPending=settings.radar?.enabled?store.list('pending',100).find(r=>r.seed.origin==='telegram-native'):null;
  const backgroundAllowed=!settings.radar?.enabled||store.summary().researchCallsToday<2;
  const job=!deliveryOnly&&(jobId||userPending||backgroundAllowed)&&store.summary().modelCallsToday+2<=dailyLimit?store.claim({id:jobId??userPending?.id}):null;
  if(job){
   try{
    const prior=job.seed.parentJob?store.get(job.seed.parentJob)?.bundle:undefined;
    const {bundle,coverage}=await build(job.seed,{now,priorSources:prior?.sources,priorCalculations:prior?.calculations});result.coverage=coverage;
    if(!bundle){store.finish(job.id,job.owner,{state:'research',error:'RESEARCH_EVIDENCE_INSUFFICIENT'});result.outcome='evidence-insufficient';}
    else{
     store.saveBundle(job.id,job.owner,bundle);store.reserveCall(job.id,job.owner,'analysis',{dailyLimit});result.nativeCalls++;
     const {execution,...raw}=await complete({bundle,stage:'analysis'}),analysis=validateResearchAnalysis(bundle,raw);result.analysisDurationMs=execution?.durationMs;
     store.saveAnalysis(job.id,job.owner,analysis);
     if(analysis.decision!=='report'){
      store.finish(job.id,job.owner,{state:analysis.decision==='skip'?'rejected':'research',error:'RESEARCH_ANALYSIS_'+analysis.decision.toUpperCase()});result.outcome=analysis.decision;
      if(analysis.decision==='research'&&(job.seed.depth??0)<1){
       store.enqueue({...job.seed,depth:1,parentJob:job.id,revision:(job.seed.revision??'v1')+'-deepening',researchQuestions:analysis.questions});result.deepeningQueued=true;
      }
     }else{
      store.saveDraft(job.id,job.owner,analysis.report);store.reserveCall(job.id,job.owner,'contradiction',{dailyLimit});result.nativeCalls++;
      const {execution,...review}=await complete({bundle,report:analysis.report,stage:'contradiction'});result.reviewDurationMs=execution?.durationMs;
      const state=review.decision==='approve'?'ready':review.decision==='reject'?'rejected':'research';
      store.finish(job.id,job.owner,{state,review});result.outcome=state;
      if(state==='research'&&(job.seed.depth??0)<1){
       store.enqueue({...job.seed,depth:1,parentJob:job.id,revision:(job.seed.revision??'v1')+'-deepening',
        researchQuestions:review.questions??[review.strongestCounterargument.slice(0,220)]});result.deepeningQueued=true;
      }
     }
    }
   }catch(e){
    const code=/^(?:RESEARCH_|PUBLIC_RESEARCH_)[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_UNAVAILABLE';
    try{store.finish(job.id,job.owner,{state:'research',error:code});}catch{}
    result.error_code=code;
    if(['VALIDATE','PARSE','COMPLETE'].includes(e.failureStage))result.failureStage=e.failureStage;
   }
  }
  if(scheduleSlots(now).digest||forceDelivery){
   const ready=store.list('ready',10);
   // One report per tick, at most three daily attempts. Never retry an uncertain send.
   for(const row of ready){let memory;
    try{
     // A dated quote does not remain current while waiting for the digest.
     if(row.bundle.sources.some(s=>s.kind==='market-data'&&now.getTime()-Date.parse(s.publishedAt)>86400000))researchFail('RESEARCH_MARKET_REFRESH_REQUIRED');
     const dossiers=openDossiers(settings.opportunities);try{memory=dossiers.publishResearch(row);}finally{dossiers.close();}
     const text=renderResearchMessage(row.bundle,row.draft,row.review)+`\n\nDossier ${memory.id} · /opportunite ${memory.id}`;
     const sending=store.beginDelivery(row.id,{dailyLimit:settings.research.dailyDeliveryLimit??3});
     if(sending){let receipt;try{receipt=await deliver({text});}catch{}
      const outcome=store.finishDelivery(row.id,sending.owner,receipt);result[outcome.state==='delivered'?'delivered':'deliveryUnknown']++;
      result.delivery={state:outcome.state,...(receipt?.messageId?{messageId:receipt.messageId}:{}),dossier:memory.id};}
     if(sending)break;
    }catch(e){result.projection_error=/^(?:DOSSIER_|RESEARCH_)[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_PROJECTION_FAILED';
     store.holdReady(row.id,e.code==='RESEARCH_MARKET_REFRESH_REQUIRED'?e.code:'RESEARCH_PROJECTION_BLOCKED');}
   }
  }
  return {...result,...store.summary()};
 }finally{if(owns)store.close();}
}
