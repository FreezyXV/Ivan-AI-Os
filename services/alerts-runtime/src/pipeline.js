import { PILOT_CONTEXT, prefilter, fail } from './context.js';
import { withDeadline } from './deadline.js';
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value);
const numbers=value=>(value.match(/[+\-−]?\d+(?:(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?|(?:[.,]\d+)*)/g)??[]).map(n=>{
  const s=n.replace(/[ \u00a0\u202f]/g,'').replace('−','-');
  if(/^[+\-]?[1-9]\d{0,2}(?:,\d{3})+(?:\.\d+)?$/.test(s))return s.replaceAll(',','');
  return s.replaceAll(',','.');
});
export function renderBrief(item,brief){
  if(!brief||!Array.isArray(brief.facts)||brief.facts.length<1||brief.facts.length>3||
      !text(brief.utility,500)||!text(brief.action,300)||!PILOT_CONTEXT.active.includes(brief.goal)||
      (brief.uncertainty!==undefined&&!text(brief.uncertainty,300)))fail('ALERT_BRIEF_INVALID');
  for(const fact of brief.facts){
    if(!text(fact.summary,350)||!text(fact.quote,600)||!item.excerpt.includes(fact.quote)||
       numbers(fact.summary).some(n=>!numbers(fact.quote).includes(n)))fail('ALERT_FACT_UNSUPPORTED');
  }
  const grounded=brief.facts.flatMap(f=>numbers(f.quote));
  if(numbers(brief.utility+' '+brief.action).some(n=>!grounded.includes(n)))fail('ALERT_FACT_UNSUPPORTED');
  const partial=item.excerptTruncated!==false||item.excerptMode==='passages';
  const limits=[...(partial?['Lecture sur extrait partiel ; les passages omis ne sont pas vérifiés.']:[]),...(brief.uncertainty?[brief.uncertainty]:[])].join(' ');
  const paragraphs=[item.title,`${item.producer==='finance-watch'?'Relevé':'Publié'} le ${item.publishedAt.slice(0,10)}.`,...brief.facts.map(f=>`• ${f.summary}`),
    `\nUtilité pour toi : ${brief.utility}`,`\nÀ faire : ${brief.action}`,
    ...(limits?[`\nLimite : ${limits}`]:[]),`\nSource : ${item.url}`];
  const message=paragraphs.join('\n');if(message.length>2500)fail('ALERT_BRIEF_TOO_LONG');return message;
}
// Selection policy (Claude calibration 2026-10-05). Default = historical 0.75 rule; a
// calibrated policy is configuration, validated here, never a model choice.
export const DEFAULT_SELECTION_POLICY=Object.freeze({keepMinConfidence:0.75,skipMinConfidence:0.75});
export function selectionOutcome(selection,policy=DEFAULT_SELECTION_POLICY){
  const unit=v=>Number.isFinite(v)&&v>=0&&v<=1,optional=v=>v===undefined||(unit(v)&&v>0);
  if(!policy||!unit(policy.keepMinConfidence)||!unit(policy.skipMinConfidence)||!optional(policy.keepMinProbability)||!optional(policy.skipMinProbability))fail('ALERT_SELECTION_POLICY_INVALID');
  const p=selection.probabilities;
  if(p&&policy.keepMinProbability!==undefined&&p.keep>=policy.keepMinProbability)return 'keep';
  if(selection.decision==='keep'&&selection.confidence>=policy.keepMinConfidence)return 'keep';
  if(p&&policy.skipMinProbability!==undefined&&p.skip>=policy.skipMinProbability)return 'skip';
  if(selection.decision==='skip'&&selection.confidence>=policy.skipMinConfidence)return 'skip';
  return 'review';
}
export async function processNext({ledger,select,synthesize,now=Date.now(),maxAgeHours,stageTimeoutMs=30000,selectionPolicy=DEFAULT_SELECTION_POLICY}){
  selectionOutcome({decision:'review',confidence:0},selectionPolicy); // invalid configuration fails before any claim
  if(!Number.isInteger(stageTimeoutMs)||stageTimeoutMs<10||stageTimeoutMs>60000)fail('ALERT_DEADLINE_CONFIG_INVALID');
  const job=ledger.claim();if(!job)return {state:'idle'};
  const complete=(state,reason,brief)=>{
    try{return ledger.finish(job.id,job.owner,{state,reason,brief});}
    catch(error){if(error?.code==='ALERT_LEASE_LOST')return{id:job.id,state:'lease_lost'};throw error;}
  };
  const local=prefilter(job.item,{now,maxAgeHours});
  if(local.decision!=='select')return complete(local.decision==='skip'?'skipped':'review',local.reason);
  if(typeof select!=='function')return complete('review','SELECTION_NOT_CONFIGURED');
  let selection;
  try{selection=await withDeadline(signal=>select(job.item,PILOT_CONTEXT,{signal}),stageTimeoutMs,'SELECTION_TIMEOUT');}
  catch(error){return complete('review',error?.code==='SELECTION_TIMEOUT'?'SELECTION_TIMEOUT':'SELECTION_UNAVAILABLE');}
  if(!selection||!['keep','skip','review'].includes(selection.decision)||
     !Number.isFinite(selection.confidence)||selection.confidence<0||selection.confidence>1)return complete('review','SELECTION_INVALID');
  const trace={decision:selection.decision,confidence:selection.confidence,
    ...(['jev','deterministic-kernel'].includes(selection.provider)?{provider:selection.provider}:{}),
    ...(/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(selection.request_id??'')?{request_id:selection.request_id}:{}),
    ...(selection.context_version===PILOT_CONTEXT.version?{context_version:selection.context_version}:{}),
    ...(selection.probabilities?{probabilities:selection.probabilities}:{})};
  const outcome=selectionOutcome(selection,selectionPolicy);
  if(outcome==='skip')return complete('skipped','SELECTION_REJECTED',{selection:trace});
  if(outcome!=='keep')return complete('review','SELECTION_UNCERTAIN',{selection:trace});
  if(!ledger.ownsLease(job.id,job.owner))return{id:job.id,state:'lease_lost'};
  if(typeof synthesize!=='function')return complete('review','SYNTHESIS_NOT_CONFIGURED',{selection:trace});
  try{
    const brief=await withDeadline(signal=>synthesize(job.item,PILOT_CONTEXT,{signal}),stageTimeoutMs,'SYNTHESIS_TIMEOUT');
    const message=renderBrief(job.item,brief);
    return complete('ready','BRIEF_VERIFIED',{...brief,message,contextVersion:PILOT_CONTEXT.version,selection:trace});
  }catch(e){return complete('review',['ALERT_FACT_UNSUPPORTED','SYNTHESIS_TIMEOUT'].includes(e?.code)?e.code:'SYNTHESIS_UNAVAILABLE',{selection:trace});}
}
export async function deliverReady({ledger,id,deliver,timeoutMs=30000}){
  if(typeof deliver!=='function')fail('ALERT_DELIVERY_NOT_CONFIGURED');
  const job=ledger.beginDelivery(id);if(!job)return {state:'not_ready'};
  let receipt;try{receipt=await withDeadline(signal=>deliver({id:job.id,text:job.brief.message,signal}),timeoutMs,'DELIVERY_TIMEOUT');}catch{}
  // Unknown delivery never retries automatically: Telegram may have accepted
  // a message before a timeout. Reconcile against its receipt first.
  return ledger.finishDelivery(job.id,job.owner,receipt);
}
