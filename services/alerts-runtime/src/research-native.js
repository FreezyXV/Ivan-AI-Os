import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {RESEARCH_VERSION,RESEARCH_ANALYSIS_VERSION,sealBundle,validateResearchAnalysis,validateResearchReview,researchFail,factCheckCode} from './research-contract.js';
const run=promisify(execFile);
export function createNativeResearch({binary='openclaw',runImpl=run,timeoutMs=60000}={}){
 return async({bundle,stage,report,signal,repairCheck})=>{
  bundle=sealBundle(bundle);if(!['analysis','contradiction'].includes(stage))researchFail('RESEARCH_STAGE_INVALID');
  if(repairCheck!==undefined&&(stage!=='analysis'||!factCheckCode(repairCheck)))researchFail('RESEARCH_STAGE_INVALID');
  const started=Date.now();let failureStage='COMPLETE';
  try{
   const {stdout}=await runImpl(binary,['gateway','call','tools.invoke','--params',JSON.stringify({name:'ivan_research_complete',agentId:'ivan-system',sessionKey:'agent:ivan-system:main',args:{bundle,stage,...(report?{report}:{}),...(repairCheck?{repairCheck}:{})}}),
    '--json','--timeout',String(timeoutMs+5000)],{signal,timeout:timeoutMs+10000,maxBuffer:200000});
   failureStage='PARSE';const value=JSON.parse(stdout.slice(stdout.indexOf('{'))),d=value.output?.details;
   failureStage='VALIDATE';
   if(value.ok!==true||d?.status!=='COMPLETE'||d.stage!==stage||d.bundleId!==bundle.id||d.version!==RESEARCH_VERSION||d.analysisVersion!==RESEARCH_ANALYSIS_VERSION||d.execution!=='native-isolated-completion'){
    failureStage=['VALIDATE','PARSE','COMPLETE'].includes(d?.phase)?d.phase:failureStage;
    researchFail(/^RESEARCH_[A-Z_]+$/.test(d?.error_code??'')?d.error_code:'RESEARCH_NATIVE_UNAVAILABLE',{check:factCheckCode(d?.check)});
   }
   let result;
   if(stage==='analysis'){
    result=validateResearchAnalysis(bundle,d.result);
   }else result=validateResearchReview(bundle,report,{...d.result,binding:d.binding});
   return {...result,execution:{stage,durationMs:Date.now()-started,bundleId:bundle.id,modelCalls:1,nativeCostEur:null}};
  }catch(e){const code=/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_NATIVE_UNAVAILABLE';researchFail(code,{failureStage,check:factCheckCode(e.check)});}
 };
}
