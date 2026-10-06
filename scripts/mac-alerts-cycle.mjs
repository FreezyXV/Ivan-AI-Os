import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {openLedger} from '../services/alerts-runtime/src/ledger.js';
import {scheduleSlots} from '../services/alerts-runtime/src/schedule.js';
import {financeCycle,businessCycle,businessHasPendingEvidence} from '../services/alerts-runtime/src/engines.js';
import {createNativeSynthesis,createNativeAssessment} from '../services/alerts-runtime/src/synthesis.js';
import {createNativeVerification} from '../services/alerts-runtime/src/verification.js';
import {createTelegramDelivery} from '../services/alerts-runtime/src/telegram-delivery.js';
import {createJevSelector} from '../services/alerts-runtime/src/jev-selector.js';
import {processNext} from '../services/alerts-runtime/src/pipeline.js';
import {selectionOutcome,DEFAULT_SELECTION_POLICY} from '../services/alerts-runtime/src/pipeline.js';
import {createHash} from 'node:crypto';
import {sendDigest} from '../services/alerts-runtime/src/digest.js';
import {prefilter} from '../services/alerts-runtime/src/context.js';
import {collectOfficialRelease} from '../services/alerts-runtime/src/official-releases.js';
import {ingestCandidates} from './ingest-alert-candidates.mjs';
const run=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));
export async function collectFeeds({directory,ledger,runImpl=run,ingestImpl=ingestCandidates,officialImpl=collectOfficialRelease}){
 const temp=mkdtempSync(path.join(directory,'feed-'));
 try{
  const output=path.join(temp,'candidates.json');
  await runImpl('python3',[path.join(root,'scripts/collector_export.py'),'--config',path.join(root,'scripts/alert-feeds.json'),'--output',output],{timeout:125000,maxBuffer:65536});
  const envelope=JSON.parse(readFileSync(output));
  const result=await ingestImpl({ledger,envelope,readLimit:8});
  let official;try{official=await officialImpl({ledger});}catch{official={error_code:'OFFICIAL_RELEASE_UNAVAILABLE'};}
  const sourceErrors=[...envelope.errors,...(official.errors??[]),...(official.error_code?[{code:official.error_code}]:[])].map(error=>({
   code:/^[A-Z_]{1,64}$/.test(error?.code??'')?error.code:'FEED_UNAVAILABLE',
   ...(/^[a-f\d]{16}$/.test(error?.feedId??'')?{feedId:error.feedId}:{})}));
  return {...result,official,sourceErrors,exported:envelope.items.length,excluded:envelope.excluded,failedFeeds:sourceErrors.length};
 }finally{rmSync(temp,{recursive:true,force:true});}
}
export async function runCycle({ledger,settings,now=new Date(),digestNow=false,processNow=false,
 feeds=()=>collectFeeds({directory:settings.stateDir,ledger}),finance=()=>financeCycle({ledger,useJev:(settings.selectionMode??'jev')==='jev'}),business=()=>businessCycle({ledger,useJev:(settings.selectionMode??'jev')==='jev'}),
 hasBusinessEvidence=()=>businessHasPendingEvidence(ledger),
 select,assess,verify,synthesize=createNativeSynthesis({binary:settings.openclawBinary}),
 deliver=createTelegramDelivery({binary:settings.openclawBinary,target:settings.target})}={}){
 const selectionPolicy=settings.selectionPolicy??DEFAULT_SELECTION_POLICY;
 const selectionMode=settings.selectionMode??'jev';
 if(!['jev','native-editorial','jev-native-editorial'].includes(selectionMode))throw Error('ALERT_SELECTION_MODE_INVALID');
 if(selectionMode!=='native-editorial')select??=createJevSelector();
 if(selectionMode!=='jev')assess??=createNativeAssessment({binary:settings.openclawBinary});
 if(settings.verifyNativeBrief!==undefined&&typeof settings.verifyNativeBrief!=='boolean'||
    settings.verifyNativeBrief&&selectionMode!=='native-editorial')throw Error('ALERT_VERIFICATION_CONFIG_INVALID');
 if(settings.verifyNativeBrief)verify??=createNativeVerification({binary:settings.openclawBinary});
 selectionOutcome({decision:'review',confidence:0},selectionPolicy);
 const started=Date.now(),slots=scheduleSlots(now,{digestNow}),results={};ledger.reconcile();ledger.settleReady(now.getTime());ledger.retryTransient();
 let editorialRevisions=0;
 let policyRevisions=0;
 if(settings.selectionPolicy&&selectionMode!=='native-editorial'){
  const revision='policy-'+createHash('sha256').update(JSON.stringify(selectionPolicy)).digest('hex').slice(0,16);
  for(const row of ledger.reviewCandidates({revision})){
    const outcome=selectionOutcome(row.brief?.selection,selectionPolicy);
    if(ledger.reconsiderReviewedSelection(row.id,{revision,outcome,policy:selectionPolicy}).revised)policyRevisions++;
  }
 }
 const staleReviews=ledger.settleStaleReviews(now.getTime());let retention;
 try{retention={...ledger.archiveTerminal(),expiredReviews:staleReviews.expired};}
 catch(error){retention={error_code:error?.code==='ALERT_ARCHIVE_UNAVAILABLE'?error.code:'ALERT_RETENTION_UNAVAILABLE',expiredReviews:staleReviews.expired};}
 const perform=async(name,key,fn)=>{
  const lease=ledger.claimCycle(name,key);if(!lease)return;
  const at=Date.now();
  try{const result=await fn();
   const degraded=(Array.isArray(result?.sourceErrors)&&result.sourceErrors.length>0)||result?.failedFeeds>0||result?.readerErrors>0||result?.decisionErrors>0||result?.pendingDecisions>0;
   results[name]={...result,...(degraded?{degraded:true}:{})};
   ledger.finishCycle(lease,{ok:!degraded,metrics:{durationMs:Date.now()-at,result:results[name]}});}
  catch(error){const code=typeof error.code==='string'&&/^[A-Z_]{1,60}$/.test(error.code)?error.code:'CYCLE_FAILED';results[name]={error_code:code};ledger.finishCycle(lease,{ok:false,metrics:{durationMs:Date.now()-at,error_code:code}});}
 };
 await perform('feeds',slots.feeds,feeds);
 if(slots.finance)await perform('finance',slots.finance,finance);
 if(slots.business)await perform('business',slots.business,business);
 if(slots.business&&ledger.cycleStatus().some(r=>r.key===slots.business&&r.status==='done')&&
   hasBusinessEvidence())await perform('business',slots.business+':evidence',business);
 const processKey=processNow?'process:verify:'+now.toISOString().slice(0,16).replace(/[T:]/g,'-'):
  selectionMode==='native-editorial'?'process:native:'+Math.floor(now.getTime()/300000):
  slots.feeds.replace('feeds:','process:')+':'+now.getUTCHours()+(selectionMode!=='jev'?':'+selectionMode:'');
 await perform('process',processKey,async()=>{
  if(selectionMode==='native-editorial')editorialRevisions=ledger.reassessJevAbstentions().requeued;
  let decisions=0,generations=0,nativeCalls=0,businessFichesCreated=0,opportunityScoresCreated=0;const states={};
  const modelBudget=verify?4:2,requiredCalls=verify?2:1;
  for(let i=0;i<100&&decisions<8&&nativeCalls+requiredCalls<=modelBudget;i++){
   const result=await processNext({ledger,now:now.getTime(),stageTimeoutMs:60000,selectionPolicy,
    select:async(...args)=>{decisions++;return select(...args);},
    ...(selectionMode!=='jev'?{assessmentAfterSelection:selectionMode==='jev-native-editorial',assess:async(...args)=>{nativeCalls++;const result=await assess(...args);if(result.decision==='keep')generations++;return result;}}:{}),
    ...(verify?{verify:async(...args)=>{nativeCalls++;return verify(...args);}}:{}),
    synthesize:async(...args)=>{nativeCalls++;generations++;return synthesize(...args);}});
   if(result.state==='idle')break;states[result.reason??result.state]=(states[result.reason??result.state]??0)+1;
   if(result.state==='ready'&&result.brief?.business_fiche){businessFichesCreated++;if(result.brief.business_fiche.moteur)opportunityScoresCreated++;}
  }
  return {selectionMode,decisions,nativeCalls,generations,businessFichesCreated,opportunityScoresCreated,states};
 });
 if(slots.digest&&ledger.list('ready',100).some(r=>prefilter(r.item,{now:now.getTime()}).decision==='select')){
  // A source may finish after the day's first page. Reserve the next stable page
  // without replaying a completed cycle or continuing an uncertain delivery.
  let cycleKey;
  for(let page=1;page<=3;page++){
   const status=ledger.digestStatus(page===1?slots.digest:`${slots.digest}:p${page}`);
   if(!status){cycleKey=page===1?slots.digest:`${slots.digest}:continuation:p${page}`;break;}
   if(status.state!=='delivered')break;
  }
  if(cycleKey)await perform('digest',cycleKey,()=>sendDigest({ledger,key:slots.digest,deliver,now:now.getTime()}));
 }
 return {at:now.toISOString(),durationMs:Date.now()-started,results,queue:ledger.counts(),business:ledger.businessSummary(),retention,policyRevisions,editorialRevisions};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let ledger;
 try{
  const [settingsPath,...flags]=process.argv.slice(2);
  if(!settingsPath||flags.some(f=>!['--digest-now','--process-now'].includes(f)))throw Error('ALERT_CYCLE_USAGE');
  const settings=JSON.parse(readFileSync(settingsPath));ledger=openLedger(path.join(settings.stateDir,'alerts.sqlite'));
  const result=await runCycle({ledger,settings,digestNow:flags.includes('--digest-now'),processNow:flags.includes('--process-now')});
  // Feed receipts/source hashes stay in private cycle state. No raw source/prompt.
  console.log(JSON.stringify(result));
  if(Object.values(result.results).some(r=>r?.error_code))process.exitCode=1;
 }catch{console.error('MAC_ALERT_CYCLE_FAILED');process.exitCode=1;}finally{ledger?.close();}
}
