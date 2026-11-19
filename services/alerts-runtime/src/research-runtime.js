import {openResearchStore,requestedResearch,researchMissionId} from './research-store.js';import {discoverResearch,buildResearchBundle} from './research-discovery.js';
import {createNativeResearch} from './research-native.js';import {renderResearchMessage,researchFail,validateResearchAnalysis,factCheckCode} from './research-contract.js';
import {openDossiers} from '../../../shared/opportunity-dossier.mjs';import {createTelegramDelivery} from './telegram-delivery.js';
import {parisDay,scheduleSlots} from './schedule.js';
import {missionOutcome} from './mission-status.js';
import {checkOneResearchWatch} from './research-watch.js';

function choiceStillApplies(seed,config){
 if(!seed.watchId&&!seed.testId)return true;
 const dossiers=openDossiers(config);
 try{
  const current=dossiers.researchContext(seed.watchId??seed.testId);
  return current?.choice===(seed.watchId?'veille':'tester')&&current.choiceRevision===seed.choiceRevision;
 }finally{dossiers.close();}
}

async function analyze({store,job,bundle,complete,limits,result}){
 const request=async repairCheck=>{
  store.reserveCall(job.id,job.owner,repairCheck?'analysis_repair':'analysis',limits);
  result.nativeCalls++;
  const {execution,...raw}=await complete({bundle,stage:'analysis',...(repairCheck?{repairCheck}:{})});
  result.analysisDurationMs=execution?.durationMs;
  return validateResearchAnalysis(bundle,raw);
 };
 try{return await request();}
 catch(error){
  const check=factCheckCode(error.check);
  if(error.code!=='RESEARCH_FACT_UNSUPPORTED'||!check||!requestedResearch(job.seed)||
   !store.hasModelCapacity({...limits,priority:true,count:2}))throw error;
  result.repairedCheck=check;
  return request(check);
 }
}
export async function researchTick({settings,ledger,now=new Date(),store,
 discover=discoverResearch,build=buildResearchBundle,complete=createNativeResearch({binary:settings?.openclawBinary}),
 deliver=createTelegramDelivery({binary:settings?.openclawBinary,target:settings?.target}),forceDelivery=false,deliveryOnly=false,requestedOnly=false,jobId}={}){
 if(!settings?.research?.enabled)return {state:'disabled'};
 if(!settings.opportunities||typeof settings.research.directory!=='string')researchFail('RESEARCH_RUNTIME_CONFIG_INVALID');
 const owns=!store;store??=openResearchStore(settings.research.directory);
 const result={nativeCalls:0,delivered:0,deliveryUnknown:0};
 try{
  result.reconciled=store.reconcile();
  const missions=settings.research.missions===true;
  if(!requestedOnly&&!deliveryOnly&&missions)result.retired=store.retireBackground({pendingPerTopic:settings.research.pendingPerTopic??6});
  const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(now);
  const key=`discovery:${missions?'missions:':''}${parisDay(now)}:${Math.floor(Number(p)/3)}`;
  if(!requestedOnly&&!deliveryOnly&&!store.discovery(key)){
   result.discovery=await discover({store,ledger,now,...(missions?{pendingPerTopic:settings.research.pendingPerTopic??6}:{})});store.recordDiscovery(key,result.discovery);
   if(missions&&settings.research.watches&&!store.nextRequest())result.watch=await checkOneResearchWatch({store,settings,now});
  }
  const dailyLimit=settings.research.dailyModelLimit??12;
  const limits={dailyLimit,reservedForRequests:settings.research.reservedForRequests??0};
  const chosen=jobId?store.get(jobId):store.nextRequest();
  const backgroundAllowed=!settings.radar?.enabled||store.summary().researchCallsToday<2;
  const job=!deliveryOnly&&(chosen||!requestedOnly&&backgroundAllowed)&&
   store.hasModelCapacity({...limits,priority:requestedResearch(chosen?.seed),count:2})?store.claim({id:chosen?.id}):null;
  if(job){
   try{
    if(!choiceStillApplies(job.seed,settings.opportunities)){
     store.finish(job.id,job.owner,{state:'rejected',error:'RESEARCH_CHOICE_SUPERSEDED'});
     result.outcome='choice-updated';
    }else{
    const prior=job.seed.parentJob?store.get(job.seed.parentJob)?.bundle:undefined;
    const {bundle,coverage}=await build(job.seed,{now,priorSources:prior?.sources,priorCalculations:prior?.calculations});result.coverage=coverage;
    if(!bundle){store.finish(job.id,job.owner,{state:'research',error:'RESEARCH_EVIDENCE_INSUFFICIENT'});result.outcome='evidence-insufficient';}
    else{
     store.saveBundle(job.id,job.owner,bundle);
     const analysis=await analyze({store,job,bundle,complete,limits,result});
     store.saveAnalysis(job.id,job.owner,analysis);
     if(analysis.decision!=='report'){
      store.finish(job.id,job.owner,{state:analysis.decision==='skip'?'rejected':'research',error:'RESEARCH_ANALYSIS_'+analysis.decision.toUpperCase()});result.outcome=analysis.decision;
      if(analysis.decision==='research'&&(job.seed.depth??0)<1){
       store.enqueue({...job.seed,depth:1,parentJob:job.id,missionId:researchMissionId(job),revision:(job.seed.revision??'v1')+'-deepening',researchQuestions:analysis.questions});result.deepeningQueued=true;
      }
     }else{
      store.saveDraft(job.id,job.owner,analysis.report);store.reserveCall(job.id,job.owner,'contradiction',limits);result.nativeCalls++;
      const {execution,...review}=await complete({bundle,report:analysis.report,stage:'contradiction'});result.reviewDurationMs=execution?.durationMs;
      const state=review.decision==='approve'?'ready':review.decision==='reject'?'rejected':'research';
      store.finish(job.id,job.owner,{state,review});result.outcome=state;
      if(state==='research'&&(job.seed.depth??0)<1){
       store.enqueue({...job.seed,depth:1,parentJob:job.id,missionId:researchMissionId(job),revision:(job.seed.revision??'v1')+'-deepening',
        researchQuestions:review.questions??[review.strongestCounterargument.slice(0,220)]});result.deepeningQueued=true;
      }
     }
    }
    }
   }catch(e){
    const code=/^(?:RESEARCH_|PUBLIC_RESEARCH_)[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_UNAVAILABLE';
    try{store.finish(job.id,job.owner,{state:'research',error:code});}catch{}
    result.error_code=code;
    if(['VALIDATE','PARSE','COMPLETE'].includes(e.failureStage))result.failureStage=e.failureStage;
    if(factCheckCode(e.check))result.failureCheck=e.check;
   }
  }
  const scheduled=!requestedOnly&&(scheduleSlots(now).digest||forceDelivery);
  if(scheduled||missions){
   const ready=missions?store.readyRequests():[];
   if(scheduled)for(const row of store.list('ready',10))if(!ready.some(r=>r.id===row.id))ready.push(row);
   // One report per tick, at most three daily attempts. Never retry an uncertain send.
   for(const row of ready){let memory;
    try{
     if(!choiceStillApplies(row.seed,settings.opportunities)){
      store.holdReady(row.id,'RESEARCH_CHOICE_SUPERSEDED');
      continue;
     }
     // A dated quote does not remain current while waiting for the digest.
     if(row.bundle.sources.some(s=>s.kind==='market-data'&&now.getTime()-Date.parse(s.publishedAt)>86400000))researchFail('RESEARCH_MARKET_REFRESH_REQUIRED');
     const dossiers=openDossiers(settings.opportunities);try{memory=dossiers.publishResearch(row);}finally{dossiers.close();}
     const qualification=row.seed.origin==='codex-qualification'?'Vérification du parcours par Codex\n\n':'';
     const watch=row.seed.watchId?'Évolution d’un dossier en veille\n\n':'';
     const text=qualification+watch+renderResearchMessage(row.bundle,row.draft,row.review)+`\n\nDossier ${memory.id} · /opportunite ${memory.id}`;
     const sending=store.beginDelivery(row.id,{dailyLimit:settings.research.dailyDeliveryLimit??3});
     if(sending){let receipt;try{receipt=await deliver({text});}catch{}
      const outcome=store.finishDelivery(row.id,sending.owner,receipt);result[outcome.state==='delivered'?'delivered':'deliveryUnknown']++;
      result.delivery={state:outcome.state,...(receipt?.messageId?{messageId:receipt.messageId}:{}),dossier:memory.id};}
     if(sending)break;
    }catch(e){result.projection_error=/^(?:DOSSIER_|RESEARCH_)[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_PROJECTION_FAILED';
     store.holdReady(row.id,e.code==='RESEARCH_MARKET_REFRESH_REQUIRED'?e.code:'RESEARCH_PROJECTION_BLOCKED');}
   }
  }
  if(missions&&!deliveryOnly&&!result.delivery){
   const notice=store.nextNotice({after:Date.parse(settings.research.missionsSince??'')||0});
   if(notice&&store.reserveNotice(notice)){
    let receipt;try{receipt=await deliver({text:missionOutcome(notice)});}catch{/* reconcile as uncertain */}
    if(store.finishNotice(notice,receipt))result.noticeDelivered=1;else result.deliveryUnknown++;
   }
  }
  return {...result,...store.summary()};
 }finally{if(owns)store.close();}
}
