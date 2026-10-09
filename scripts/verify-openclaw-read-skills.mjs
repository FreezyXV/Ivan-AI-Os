// Native contracts, not hand-built bearer requests. The CLI resolves SecretRefs.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run=promisify(execFile);
const installed=process.argv.includes('--installed');
const targets=[
 ['ivan-business','business-engine','ivan_business_brief',{}],
 ['ivan-finance','finance-engine','ivan_finance_brief',{}],
 ['ivan-system','memoire-obsidian','ivan_memory_search',{query:'fusion',limit:1}],
 ['ivan-knowledge','memoire-obsidian','ivan_memory_search',{query:'fusion',limit:1}]
];
async function rpc(method,params){
 const {stdout}=await run('openclaw',['gateway','call',method,'--params',JSON.stringify(params),'--json','--timeout','15000'],{timeout:25000,maxBuffer:1024*1024});
 return JSON.parse(stdout.slice(stdout.indexOf('{')));
}
try{
 const checks=[];
 for(const [agentId,skill,name,args] of targets){
  const tool=await rpc('tools.invoke',{name,agentId,sessionKey:`agent:${agentId}:main`,args});
  const check={agentId,skill,tool_available:tool.ok===true,brief_status:tool.output?.details?.status??null};
  if(installed){
   const report=await rpc('skills.status',{agentId});
   const found=report.skills?.find(s=>s.name===skill);
   check.skill_loaded=!!found&&found.eligible===true&&!found.disabled&&!found.blockedByAllowlist;
  }
  checks.push(check);
 }
 const blocked=await rpc('tools.invoke',{name:'ivan_memory_search',agentId:'main',sessionKey:'agent:main:main',args:{query:'fusion',limit:1}});
 const ok=checks.every(c=>c.tool_available&&(!installed||c.skill_loaded))&&blocked.ok===false;
 console.log(JSON.stringify({ok,checks,main_memory_denied:blocked.ok===false,model_calls:0,telegram_messages:0}));
 if(!ok)process.exitCode=1;
}catch{console.error('NATIVE_READ_SKILL_CHECK_FAILED');process.exitCode=1;}
