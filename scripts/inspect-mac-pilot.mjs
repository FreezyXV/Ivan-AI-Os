import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { readDecisionToken } from '../services/jev-gateway/src/runtime-token.js';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {homedir} from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
const knownAgents = new Set(['main','ivan-business','ivan-finance','ivan-engineering','ivan-system','ivan-knowledge','ivan-career']);
const knownStatuses = new Set(['ok','error','skipped']);

export function summarizeAlertCycles({counts=[],cycles=[],reviewReasons=[],delivery=null,sourceCommit,selectionMode}){
 const queue=Object.fromEntries(counts.filter(r=>['pending','processing','review','ready','sending','delivered','skipped','delivery_unknown','expired_unsent'].includes(r.state)&&Number.isSafeInteger(r.n)&&r.n>=0).map(r=>[r.state,r.n]));
 const reasons=Object.fromEntries(reviewReasons.filter(r=>/^[A-Z_]{1,64}$/.test(r.reason??'')&&Number.isSafeInteger(r.n)&&r.n>=0).map(r=>[r.reason,r.n]));
 const latest=cycles.filter(r=>['feeds','finance','business','process','digest'].includes(r.name)).map(r=>{
  let m;try{m=JSON.parse(r.metrics??'{}');}catch{m={};}
  const result=m.result??{};const sourceErrors=result.sourceErrors?.length??0;
  return {name:r.name,status:['running','done','failed'].includes(r.status)?r.status:'unknown',
   degraded:result.degraded===true||sourceErrors>0||result.failedFeeds>0,sourceErrors,
   attempts:r.attempts,durationMs:m.durationMs,...(Number.isInteger(result.decisions)?{decisions:result.decisions}:{}),
   ...(Number.isInteger(result.generations)?{generations:result.generations}:{}),
   ...(Number.isInteger(result.nativeCalls)?{nativeCalls:result.nativeCalls}:{})};
 });
 const diagnosis=(queue.delivery_unknown??0)+(queue.sending??0)>0?{code:'CHECK_DELIVERY_RECEIPT',message:'Envoi incertain : vérifier son reçu avant tout nouvel envoi.'}:
  queue.ready>0?{code:'WAIT_DIGEST',message:'Synthèses prêtes pour le prochain digest.'}:
  (queue.pending??0)+(queue.processing??0)>0?{code:'PROCESS_PENDING',message:'Des preuves attendent le prochain passage de traitement ; vérifier le planning et ses erreurs.'}:
  (reasons.NATIVE_ASSESSMENT_UNAVAILABLE??0)+(reasons.NATIVE_ASSESSMENT_TIMEOUT??0)>0?{code:'CHECK_NATIVE_GENERATION',message:'Vérifier le service de complétion et son unique nouvel essai.'}:
  selectionMode!=='native-editorial'&&reasons.SELECTION_UNCERTAIN>0?{code:'CALIBRATE_RELEVANCE',message:'La sélection retient des cas incertains : améliorer et mesurer la pertinence avant de forcer des messages.'}:
  reasons.SOURCE_NOT_READ>0?{code:'EXPAND_READERS',message:'Des sources restent non lues : compléter leur lecture avant la synthèse.'}:
  {code:'NO_SELECTED_NEWS',message:'Aucune nouvelle synthèse retenue ; ce silence ne prouve pas une panne.'};
 return {sourceCommit:/^[a-f\d]{40}$/.test(sourceCommit??'')?sourceCommit:undefined,
  selectionMode:['jev','native-editorial','jev-native-editorial'].includes(selectionMode)?selectionMode:undefined,queue,reviewReasons:reasons,diagnosis,latest,
  lastDelivery:delivery?{at:delivery.updated,messageId:delivery.messageId}:null,prose_usage_available:false};
}
async function inspectAlertCycles(){
 let db;
 try{
  const plist=path.join(homedir(),'Library/LaunchAgents/com.ivan-ai-os.alerts.plist');
  const {stdout}=await run('/usr/bin/plutil',['-convert','json','-o','-',plist],{timeout:5000});
  const args=JSON.parse(stdout).ProgramArguments;if(args?.length!==3||!args[1].endsWith('/scripts/mac-alerts-cycle.mjs'))throw Error();
  const settings=JSON.parse(readFileSync(args[2]));db=new DatabaseSync(path.join(settings.stateDir,'alerts.sqlite'),{readOnly:true});
  const counts=db.prepare('SELECT state,count(*) AS n FROM alerts GROUP BY state').all();
  const reviewReasons=db.prepare("SELECT reason,count(*) AS n FROM alerts WHERE state='review' GROUP BY reason").all();
  const cycles=db.prepare('SELECT name,status,attempts,metrics FROM cycles ORDER BY updated DESC LIMIT 20').all();
  const last=db.prepare("SELECT updated,receipt FROM alerts WHERE state='delivered' ORDER BY updated DESC LIMIT 1").get();
  const delivery=last?{updated:last.updated,messageId:JSON.parse(last.receipt).messageId}:null;
  const summary=summarizeAlertCycles({counts,cycles,reviewReasons,delivery,sourceCommit:settings.sourceCommit,selectionMode:settings.selectionMode??'jev'});
  try{const {stdout:service}=await run('/bin/launchctl',['print',`gui/${process.getuid()}/com.ivan-ai-os.alerts`],{timeout:5000});
   summary.schedule={loaded:true,lastExitCode:Number(service.match(/last exit code = (\d+)/)?.[1]??0),
    running:/^\s*state = running$/m.test(service)};
  }catch{summary.schedule={loaded:false};}
  return summary;
 }catch{return {error_code:'ALERT_INVENTORY_UNAVAILABLE'};}finally{db?.close();}
}

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

export async function inspectPilot({ call=native, fetchImpl=fetch, getToken=readDecisionToken,alertInventory=inspectAlertCycles } = {}) {
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
  const [openclawHealthy,automations,jevStatus,alertStatus]=await Promise.all([health(),inventory(),jev(),alertInventory()]);
  return { openclaw_healthy:openclawHealthy,jev:jevStatus,automations,alerts:alertStatus };
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await inspectPilot()));
}
