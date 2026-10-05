import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { readDecisionToken } from '../services/jev-gateway/src/runtime-token.js';

const run = promisify(execFile);
const knownAgents = new Set(['main','ivan-business','ivan-finance','ivan-engineering','ivan-system','ivan-knowledge','ivan-career']);
const knownStatuses = new Set(['ok','error','skipped']);

export function summarizeAutomations(data) {
  if (!Array.isArray(data?.jobs) || data.hasMore ||
      (Number.isInteger(data.total) && data.total !== data.jobs.length))
    throw new Error('AUTOMATION_INVENTORY_INCOMPLETE');
  const agents = {};
  for (const job of data.jobs) {
    const id = knownAgents.has(job.agentId) ? job.agentId : 'other';
    const entry = agents[id] ??= { enabled:0, disabled:0, lastErrors:0, activeErrors:0, types:{} };
    entry[job.enabled === true ? 'enabled' : 'disabled']++;
    if (job.state?.lastRunStatus === 'error') {
      entry.lastErrors++;
      if(job.enabled===true)entry.activeErrors++;
    }
    const kind = ['heartbeat','agentTurn'].includes(job.payload?.kind) ? job.payload.kind : 'other';
    entry.types[kind] = (entry.types[kind] ?? 0) + 1;
  }
  return { total:data.jobs.length, career_enabled:agents['ivan-career']?.enabled??0, agents,
    // No prompts, recipient addresses, source content or raw exception strings.
    lastRunStatuses:data.jobs.map(j=>knownStatuses.has(j.state?.lastRunStatus)?j.state.lastRunStatus:'unknown') };
}

async function native(args) {
  const { stdout } = await run('openclaw', args, { timeout:20000,maxBuffer:1024*1024 });
  return JSON.parse(stdout.slice(stdout.indexOf('{')));
}

export async function inspectPilot({ call=native, fetchImpl=fetch, getToken=readDecisionToken } = {}) {
  const health = async()=>{
    try { return (await call(['gateway','call','health','--json','--timeout','5000'])).ok===true; }
    catch { return false; }
  };
  const inventory = async()=>{
    try { return summarizeAutomations(await call(['cron','list','--all','--json','--timeout','10000'])); }
    catch { return { error_code:'AUTOMATION_INVENTORY_UNAVAILABLE' }; }
  };
  const jev = async()=>{
    try {
      const response = await fetchImpl('http://127.0.0.1:4311/health',{redirect:'error',signal:AbortSignal.timeout(3000)});
      const body = await response.json();
      if (!response.ok || body.ok!==true) return { healthy:false };
      const token=getToken();
      if(!token)return{healthy:true,usage_available:false};
      const usageResponse=await fetchImpl('http://127.0.0.1:4311/v1/usage',{
        redirect:'error',signal:AbortSignal.timeout(3000),headers:{authorization:`Bearer ${token}`}
      });
      if (!usageResponse.ok) return { healthy:true,usage_available:false };
      const usage=await usageResponse.json();
      return { healthy:true,usage_available:true,provider:body.provider==='jev'?'jev':'other',
        usage:Object.fromEntries(['month','estimate','monthly_budget_eur','charged_estimate_eur','remaining_estimate_eur','calls','usage_unknown_calls']
          .filter(key=>key==='month'?/^\d{4}-\d{2}$/.test(usage[key]??''):key==='estimate'?typeof usage[key]==='boolean':Number.isFinite(usage[key])&&usage[key]>=0)
          .map(key=>[key,usage[key]])) };
    } catch { return { healthy:false }; }
  };
  const [openclawHealthy,automations,jevStatus]=await Promise.all([health(),inventory(),jev()]);
  return { openclaw_healthy:openclawHealthy,jev:jevStatus,automations };
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await inspectPilot()));
}
