import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {RADAR_BRIEF_VERSION,sealRadarEvidence,validateRadarCards,validateRadarReview} from './radar-brief.js';
const run=promisify(execFile);
export function createNativeRadar({binary='openclaw',runImpl=run}={}){return async({evidence,stage,cards})=>{
 evidence=sealRadarEvidence(evidence.items);let phase='COMPLETE';
 try{const {stdout}=await runImpl(binary,['gateway','call','tools.invoke','--params',JSON.stringify({name:'ivan_radar_complete',agentId:'ivan-system',sessionKey:'agent:ivan-system:main',args:{evidence,stage,...(cards?{cards}:{})}}),'--json','--timeout','65000'],{timeout:70000,maxBuffer:200000});
  phase='PARSE';const value=JSON.parse(stdout.slice(stdout.indexOf('{'))),d=value.output?.details;phase='VALIDATE';
  if(value.ok!==true||d?.status!=='COMPLETE'||d.version!==RADAR_BRIEF_VERSION||d.evidenceId!==evidence.id||d.stage!==stage||d.execution!=='native-isolated-completion'){phase=['PARSE','VALIDATE','COMPLETE'].includes(d?.phase)?d.phase:phase;throw Object.assign(Error(),{code:d?.error_code});}
  return stage==='analysis'?validateRadarCards(evidence,d.result):validateRadarReview(evidence,cards,d.result);
 }catch(e){throw Object.assign(Error('RESEARCH_RADAR_NATIVE_UNAVAILABLE'),{code:/^RESEARCH_[A-Z_]+$/.test(e.code??'')?e.code:'RESEARCH_RADAR_NATIVE_UNAVAILABLE',failureStage:phase});}
 };}
