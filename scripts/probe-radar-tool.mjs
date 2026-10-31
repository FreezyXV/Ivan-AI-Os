import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {pathToFileURL} from 'node:url';const run=promisify(execFile);
// An invalid evidence object is rejected before any model can be called.
export async function probeRadarTool({binary='openclaw',runImpl=run}={}){
 try{const {stdout}=await runImpl(binary,['gateway','call','tools.invoke','--params',JSON.stringify({name:'ivan_radar_complete',agentId:'ivan-system',sessionKey:'agent:ivan-system:main',args:{evidence:{},stage:'analysis'}}),'--json','--timeout','10000'],{timeout:15000,maxBuffer:100000});
  const r=JSON.parse(stdout.slice(stdout.indexOf('{'))),d=r.output?.details;return {available:r.ok===true&&d?.status==='UNAVAILABLE'&&d.phase==='VALIDATE'&&d.error_code==='RESEARCH_RADAR_BRIEF_INVALID',probe:'rejected-before-completion'};
 }catch{return {available:false,probe:'unavailable'};}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await probeRadarTool({binary:process.argv[2]??'openclaw'});console.log(JSON.stringify(r));if(!r.available)process.exitCode=1;}
