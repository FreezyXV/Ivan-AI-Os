import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
const run=promisify(execFile);
// Invalid, title-only evidence must be refused before completion. A generic
// healthy gateway or a persisted plugin catalog does not prove tool availability.
export async function probeAlertTool({binary='openclaw',runImpl=run}={}){
 const at=new Date().toISOString(),item={producer:'validation',scope:'public',topic:'career',url:'https://example.org/readiness',
  title:'Deferred title-only readiness probe',publishedAt:at,observedAt:at,sourceStatus:'title-only',excerpt:''};
 try{
  const {stdout}=await runImpl(binary,['gateway','call','tools.invoke','--params',JSON.stringify({name:'ivan_alert_synthesize',agentId:'ivan-system',
   sessionKey:'agent:ivan-system:main',args:{item,purpose:'assessment'}}),'--json','--timeout','10000'],{timeout:15000,maxBuffer:1000000});
  const v=JSON.parse(stdout.slice(stdout.indexOf('{'))),d=v.output?.details;
  return {available:v.ok===true&&d?.status==='UNAVAILABLE'&&d.error_stage==='VALIDATE',probe:'rejected-before-completion'};
 }catch{return{available:false,probe:'unavailable'};}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await probeAlertTool({binary:process.argv[2]??'openclaw'});console.log(JSON.stringify(result));if(!result.available)process.exitCode=1;
}
