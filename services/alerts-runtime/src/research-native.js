import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {RESEARCH_VERSION,sealBundle,validateResearchReport,reportBinding,validateResearchReview,researchFail,researchHash} from './research-contract.js';
const run=promisify(execFile);
export function createNativeResearch({binary='openclaw',runImpl=run,timeoutMs=60000}={}){
 return async({bundle,stage,report,signal})=>{
  bundle=sealBundle(bundle);if(!['analysis','contradiction'].includes(stage))researchFail('RESEARCH_STAGE_INVALID');
  const started=Date.now();let failureStage='COMPLETE';
  try{
   const {stdout}=await runImpl(binary,['gateway','call','tools.invoke','--params',JSON.stringify({name:'ivan_research_complete',agentId:'ivan-system',sessionKey:'agent:ivan-system:main',args:{bundle,stage,...(report?{report}:{})}}),
    '--json','--timeout',String(timeoutMs+5000)],{signal,timeout:timeoutMs+10000,maxBuffer:200000});
   failureStage='PARSE';const value=JSON.parse(stdout.slice(stdout.indexOf('{'))),d=value.output?.details;
   failureStage='VALIDATE';
   if(value.ok!==true||d?.status!=='COMPLETE'||d.stage!==stage||d.bundleId!==bundle.id||d.version!==RESEARCH_VERSION||d.execution!=='native-isolated-completion'){
    failureStage=['VALIDATE','PARSE','COMPLETE'].includes(d?.phase)?d.phase:failureStage;
    researchFail(/^RESEARCH_[A-Z_]+$/.test(d?.error_code??'')?d.error_code:'RESEARCH_NATIVE_UNAVAILABLE');
   }
   let result;
   if(stage==='analysis'){
    if(!['report','skip','research'].includes(d.result?.decision))researchFail('RESEARCH_REPORT_INVALID');
    if(d.result.decision==='report')result={decision:'report',report:validateResearchReport(bundle,d.result.report)};
    else if(Object.keys(d.result).length!==1)researchFail('RESEARCH_REPORT_INVALID');else result=d.result;
   }else result=validateResearchReview(bundle,report,{...d.result,binding:d.binding});
   return {...result,execution:{stage,durationMs:Date.now()-started,bundleId:bundle.id,modelCalls:1,nativeCostEur:null}};
  }catch(e){throw Object.assign(Error(/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_NATIVE_UNAVAILABLE'),{code:/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_NATIVE_UNAVAILABLE',failureStage});}
 };
}
