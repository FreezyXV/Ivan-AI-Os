import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const run=promisify(execFile);
const binary=process.argv[2]??'openclaw';
async function invoke(name,agentId,args){
  try{
    const params=JSON.stringify({name,agentId,sessionKey:`agent:${agentId}:main`,args});
    const {stdout}=await run(binary,['gateway','call','tools.invoke','--params',params,'--json','--timeout','10000'],{timeout:15000,maxBuffer:100000});
    return JSON.parse(stdout.slice(stdout.indexOf('{')));
  }catch{return null;}
}
const route=task=>invoke('ivan_route','main',{requested_tasks:[task],urgency:'none',details_available:true});
const [finance,excluded,memory,research]=await Promise.all([
  route('financial_research'),
  route('topic_research'),
  invoke('ivan_memory_search','ivan-system',{query:' '}),
  invoke('ivan_research_complete','ivan-system',{bundle:{},stage:'analysis'})
]);
const good=(call,test)=>call?.ok===true&&test(call.output?.details??{});
const checks={
  finance:good(finance,d=>d.manager==='finance'&&d.manager_confidence===1&&d.provider==='deterministic-kernel'),
  excluded:good(excluded,d=>d.reason_code==='PILOT_ROUTE_EXCLUDED'),
  memory:good(memory,d=>d.error_code==='MEMORY_QUERY_INVALID'),
  research:good(research,d=>d.phase==='VALIDATE'&&d.error_code==='RESEARCH_EVIDENCE_INSUFFICIENT')
};
const available=Object.values(checks).every(Boolean);
console.log(JSON.stringify({available,checks}));
if(!available)process.exitCode=1;
