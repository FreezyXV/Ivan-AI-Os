// Independent selection measurement only: no generation, delivery or label in the request.
import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateItem,prefilter,canonicalUrl,PILOT_CONTEXT} from '../services/alerts-runtime/src/context.js';
import {createJevSelector} from '../services/alerts-runtime/src/jev-selector.js';
export async function evaluateCorpus(corpus,{select}={}){
 if(corpus?.role!=='evaluation-independante'||!Array.isArray(corpus.cas)||corpus.cas.length>50||new Set(corpus.cas.map(c=>c.id)).size!==corpus.cas.length)throw Error('ALERT_CORPUS_INVALID');
 const results=[];let providerAttempts=0;
 for(const c of corpus.cas){
  const expected=c.attendu?.selection;
  if(c.entree?.candidats){const unique=new Set(c.entree.candidats.map(s=>canonicalUrl(s.url))).size;
   results.push({id:c.id,status:'DEDUPE_ONLY',unique,expectedUnique:c.attendu.messages,dedupeCorrect:unique===c.attendu.messages,selectionMeasured:false,deliveryMeasured:false});continue;}
  if(!c.entree?.source){results.push({id:c.id,status:'NOT_MEASURED',reason:'MULTI_TASK_REQUIRES_MANAGER',selectionMeasured:false,deliveryMeasured:false});continue;}
  try{
   const raw=c.entree.source;
   // Historical fixture adaptation is not a claim of a new page download.
   const item=validateItem({...raw,...(raw.sourceStatus==='read'&&!raw.readAt?{readAt:raw.observedAt}:{})});
   const local=prefilter(item,{now:Date.parse(raw.observedAt)});let actual,rawDecision,provider='deterministic-kernel',confidence=1,request_id;
   if(local.decision==='select'){
    if(!select){results.push({id:c.id,status:'NOT_MEASURED',reason:'JEV_REQUIRED',selectionMeasured:false,deliveryMeasured:false});continue;}
    providerAttempts++;const result=await select(item,PILOT_CONTEXT);provider=result.provider;confidence=result.confidence;request_id=result.request_id;
    rawDecision=result.decision;actual=result.confidence>=0.75?result.decision:'review';
   }else actual=local.decision==='skip'?'skip':'review';
   results.push({id:c.id,status:'MEASURED',expected,actual,rawDecision,provider,confidence,request_id,
    correct:actual===expected,tolerated:actual!==expected&&actual===c.attendu.tolere,selectionMeasured:true,
    expectedDelivery:c.attendu.livraison,deliveryMeasured:false});
  }catch(error){results.push({id:c.id,status:'ERROR',reason:/^[A-Z_]+$/.test(error.code??error.message)?(error.code??error.message):'EVALUATION_FAILED',selectionMeasured:false,deliveryMeasured:false});}
 }
 const measured=results.filter(r=>r.selectionMeasured),correct=measured.filter(r=>r.correct).length;
 const jev=measured.filter(r=>r.provider==='jev');
 return {contextVersion:PILOT_CONTEXT.version,total:results.length,measured:measured.length,correct,
  strictAccuracy:measured.length?correct/measured.length:null,tolerated:measured.filter(r=>r.tolerated).length,
  jevMeasured:jev.length,jevCorrect:jev.filter(r=>r.correct).length,
  providerAttempts,errors:results.filter(r=>r.status==='ERROR').length,deliveryMeasured:false,proseMeasured:false,results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [mode,input,output]=process.argv.slice(2);if(!['--offline','--live'].includes(mode)||!path.isAbsolute(input)||!path.isAbsolute(output))throw Error('ALERT_EVALUATION_USAGE');
  const dir=lstatSync(path.dirname(output));if(!dir.isDirectory()||dir.isSymbolicLink()||dir.uid!==process.getuid()||(dir.mode&0o077))throw Error('PRIVATE_EVALUATION_OUTPUT_REQUIRED');
  const bytes=readFileSync(input);if(bytes.length>512000)throw Error('ALERT_CORPUS_INVALID');
  const report=await evaluateCorpus(JSON.parse(bytes),{select:mode==='--live'?createJevSelector():undefined});
  writeFileSync(output,JSON.stringify({...report,mode,corpusSha256:createHash('sha256').update(bytes).digest('hex'),at:new Date().toISOString()},null,2),{mode:0o600,flag:'wx'});
  console.log(JSON.stringify(report));if(report.errors)process.exitCode=1;
 }catch(error){console.error(/^[A-Z_]+$/.test(error.message)?error.message:'ALERT_EVALUATION_FAILED');process.exitCode=1;}
}
